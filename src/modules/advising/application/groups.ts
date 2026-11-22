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
import type {
  GroupSummary,
  Role,
  StudentSummary,
} from "../domain/models";
import type {
  GroupRepositoryPort,
  UserRepositoryPort,
} from "../domain/ports";

type Actor = { id: string; role: Role };

function assertCounselor(actor: Actor): void {
  if (actor.role !== "counselor") throw new ForbiddenError();
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
    assertCounselor(input.actor);

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
    assertCounselor(input.actor);

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

    await this.users.assignToGroup({
      studentId: input.studentId,
      groupId: input.groupId,
      counselorId: input.actor.id,
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
  }): Promise<{ groups: GroupSummary[]; students: StudentSummary[] }> {
    assertCounselor(input.actor);

    const [groups, students] = await Promise.all([
      this.groups.listByCounselor(input.actor.id),
      this.users.listAssignableStudents(input.actor.id),
    ]);

    return { groups, students };
  }
}
