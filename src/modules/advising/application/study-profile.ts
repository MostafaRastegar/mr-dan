/**
 * Study profile use cases (student-owned attributes).
 *
 * Reads the user row plus catalogs, exam results and courses. Writes go
 * through `updateProfile`-style patching on `User`.
 */

import { NotFoundError, ValidationError } from "@/modules/advising/domain/errors";
import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import type {
  Exam,
  Need,
  StudentExamResult,
  SupplementaryCourse,
  UserAccount,
} from "@/modules/advising/domain/models";
import type {
  CatalogRepositoryPort,
  StudentExamResultRepositoryPort,
  SupplementaryCourseRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

const OTHER_OCCUPIED_MAX = 720;
const HOMEWORK_AVERAGE_MAX = 720;
const TARAZ_MIN = 0;
const TARAZ_MAX = 10000;

export type StudyProfileView = {
  user: UserAccount;
  needs: Need[];
  exams: Exam[];
  examResults: StudentExamResult[];
  courses: SupplementaryCourse[];
};

export class GetStudyProfileUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly catalogs: CatalogRepositoryPort,
    private readonly examResults: StudentExamResultRepositoryPort,
    private readonly courses: SupplementaryCourseRepositoryPort,
  ) {}

  async execute(input: { actor: Actor; studentId?: string }): Promise<StudyProfileView> {
    const ownerId = input.studentId ?? input.actor.id;
    await assertPlanRead(this.users, input.actor, ownerId);

    const [user, needs, exams, results, courses] = await Promise.all([
      this.users.findById(ownerId),
      this.catalogs.listNeeds(),
      this.catalogs.listExams(),
      this.examResults.listRecent(ownerId, 2),
      this.courses.listByStudent(ownerId),
    ]);
    if (!user) throw new NotFoundError("user");

    return { user, needs, exams, examResults: results, courses };
  }
}

export type UpdateStudyProfileInput = {
  actor: Actor;
  schoolMode?: string | null;
  needId?: string | null;
  takesMockExams?: boolean | null;
  otherOccupiedHours?: readonly number[]; // 7 values, 0..12 each
  homeworkAverageHours?: number | null;
};

export class UpdateStudyProfileUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly catalogs: CatalogRepositoryPort,
  ) {}

  async execute(input: UpdateStudyProfileInput): Promise<UserAccount> {
    const ownerId = input.actor.id;
    await assertPlanWrite(input.actor, "profile:write", ownerId);

    const user = await this.users.findById(ownerId);
    if (!user) throw new NotFoundError("user");

    if (input.needId !== undefined && input.needId !== null) {
      const need = await this.catalogs.findNeed(input.needId);
      if (!need || !need.active) {
        throw new ValidationError("need");
      }
    }

    if (input.otherOccupiedHours !== undefined) {
      if (input.otherOccupiedHours.length !== 7) {
        throw new ValidationError("سهٔ Rosarioهای اشغال باید ۷ مقدار باشد");
      }
      for (const h of input.otherOccupiedHours) {
        if (typeof h !== "number" || h < 0 || h > OTHER_OCCUPIED_MAX / 60) {
          throw new ValidationError("ساعت اشغال روزانه باید ۰ تا ۱۲ باشد");
        }
      }
    }

    if (input.homeworkAverageHours !== undefined && input.homeworkAverageHours !== null) {
      if (input.homeworkAverageHours < 0 || input.homeworkAverageHours > HOMEWORK_AVERAGE_MAX / 60) {
        throw new ValidationError("میانگین سالانه تکلیف باید ۰ تا ۱۲ ساعت باشد");
      }
    }

    const patch: {
      schoolMode?: string | null;
      needId?: string | null;
      takesMockExams?: boolean | null;
      otherOccupiedMinutes?: number[];
      homeworkAverageMinutes?: number | null;
    } = {};
    if (input.schoolMode !== undefined) patch.schoolMode = input.schoolMode;
    if (input.needId !== undefined) patch.needId = input.needId;
    if (input.takesMockExams !== undefined) patch.takesMockExams = input.takesMockExams;
    if (input.otherOccupiedHours !== undefined) {
      patch.otherOccupiedMinutes = input.otherOccupiedHours.map((h) => h * 60);
    }
    if (input.homeworkAverageHours !== undefined) {
      patch.homeworkAverageMinutes = input.homeworkAverageHours === null ? null : input.homeworkAverageHours * 60;
    }

    return this.users.updateProfile(ownerId, patch as never);
  }
}

export type SaveExamResultInput = {
  actor: Actor;
  examId: string;
  taraz: number;
};

export class SaveExamResultUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly catalogs: CatalogRepositoryPort,
    private readonly results: StudentExamResultRepositoryPort,
  ) {}

  async execute(input: SaveExamResultInput): Promise<StudentExamResult> {
    const ownerId = input.actor.id;
    await assertPlanWrite(input.actor, "profile:write", ownerId);

    const user = await this.users.findById(ownerId);
    if (!user) throw new NotFoundError("user");

    const exam = await this.catalogs.findExam(input.examId);
    if (!exam || !exam.active) {
      throw new ValidationError("exam");
    }

    if (input.taraz < TARAZ_MIN || input.taraz > TARAZ_MAX) {
      throw new ValidationError("taraz");
    }

    return this.results.upsert({
      studentId: ownerId,
      examId: input.examId,
      taraz: input.taraz,
    });
  }
}

export type AddSupplementaryCourseInput = {
  actor: Actor;
  title: string;
  mode: string;
  weeklyHours?: number | null;
};

export class AddSupplementaryCourseUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly courses: SupplementaryCourseRepositoryPort,
  ) {}

  async execute(input: AddSupplementaryCourseInput): Promise<SupplementaryCourse> {
    const ownerId = input.actor.id;
    await assertPlanWrite(input.actor, "profile:write", ownerId);

    if (input.title.trim().length < 1 || input.title.length > 100) {
      throw new ValidationError("title");
    }
    if (input.mode !== "in_person" && input.mode !== "virtual") {
      throw new ValidationError("mode");
    }
    if (input.weeklyHours !== undefined && input.weeklyHours !== null) {
      if (input.weeklyHours < 0.25 || input.weeklyHours > 30) {
        throw new ValidationError("weeklyHours");
      }
    }

    return this.courses.create({
      studentId: ownerId,
      title: input.title.trim(),
      mode: input.mode,
      weeklyMinutes: input.weeklyHours === undefined || input.weeklyHours === null ? null : Math.round(input.weeklyHours * 60),
    });
  }
}

export type DeleteSupplementaryCourseInput = {
  actor: Actor;
  courseId: string;
};

export class DeleteSupplementaryCourseUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly courses: SupplementaryCourseRepositoryPort,
  ) {}

  async execute(input: DeleteSupplementaryCourseInput): Promise<void> {
    const ownerId = input.actor.id;
    await assertPlanWrite(input.actor, "profile:write", ownerId);
    await this.courses.delete({ id: input.courseId, studentId: ownerId });
  }
}
