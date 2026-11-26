/**
 * Counselor group management.
 *
 * Every operation re-checks the actor role on the server; the route guard is a
 * UX shortcut, not the authorization boundary.
 */

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../domain/errors";
import { hasCapability, type Capability } from "../domain/capabilities";
import type { GroupSummary, StudentSummary } from "../domain/models";
import type {
  GroupRepositoryPort,
  UserRepositoryPort,
} from "../domain/ports";
import type { Actor } from "./planning-access";

function assertCapability(actor: Actor, capability: Capability): void {
  if (!hasCapability(actor.role, capability)) throw new ForbiddenError();
}

export class CreateGroupUseCase {
  constructor(private readonly groups: GroupRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    name: string;
    description?: string;
    targetGrade?: string;
    targetField?: string;
    color?: string;
  }): Promise<GroupSummary> {
    assertCapability(input.actor, "group:manage");

    const name = input.name.trim();
    if (!name) throw new ValidationError("نام گروه الزامی است");

    return this.groups.create({
      counselorId: input.actor.id,
      name,
      description: input.description?.trim() || null,
      targetGrade: input.targetGrade?.trim() || null,
      targetField: input.targetField?.trim() || null,
      color: input.color,
    });
  }
}

export class AssignStudentToGroupUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly groups: GroupRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId: string;
    groupId: string | null;
  }): Promise<void> {
    assertCapability(input.actor, "group:manage");

    if (input.groupId) {
      const group = await this.groups.findById(input.groupId);
      if (!group) throw new NotFoundError("گروه");
      if (group.counselorId !== input.actor.id) throw new ForbiddenError();
    }

    const student = await this.users.findById(input.studentId);
    if (!student) throw new NotFoundError("دانش‌آموز");
    if (student.role !== "student") {
      throw new ValidationError("فقط دانش‌آموز را می‌توان به گروه تخصیص داد");
    }
    if (student.counselorId && student.counselorId !== input.actor.id) {
      throw new ForbiddenError();
    }

    await this.users.assignToGroup({
      studentId: input.studentId,
      groupId: input.groupId,
      // Unassigning never transfers ownership: only a group assignment by the
      // authorized counselor writes `counselorId`.
      counselorId: input.groupId ? input.actor.id : undefined,
    });
  }
}

export class CounselorRosterUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly groups: GroupRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
  }): Promise<{
    groups: GroupSummary[];
    myStudents: StudentSummary[];
    unassigned: StudentSummary[];
  }> {
    assertCapability(input.actor, "group:manage");

    const [groups, students] = await Promise.all([
      this.groups.listByCounselor(input.actor.id),
      this.users.listAssignableStudents(input.actor.id),
    ]);

    // One pass, disjoint by construction: the query only returns students
    // owned by this counselor or by nobody.
    const myStudents: StudentSummary[] = [];
    const unassigned: StudentSummary[] = [];
    for (const student of students) {
      if (student.counselorId === input.actor.id) myStudents.push(student);
      else if (student.counselorId === null) unassigned.push(student);
    }

    return { groups, myStudents, unassigned };
  }
}
