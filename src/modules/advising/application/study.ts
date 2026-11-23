/**
 * Study session use cases.
 *
 * Record: validate category/duration/focusLevel/startedAt, force focusLevel to
 * null for non-study categories, then persist. GetStudyAnalysis: aggregate over
 * the fixed UTC+03:30 day window.
 */

import {
  ValidationError,
} from "@/modules/advising/domain/errors";
import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import {
  averageFocus,
  perDaySeries,
  perSubjectTotals,
  productivityRate,
  startOfStudyDay,
  studyDayKey,
  summarizeMinutes,
} from "@/modules/advising/application/study-metrics";
import { STUDY_CATEGORIES, type StudyCategory } from "@/modules/advising/domain/models";
import type {
  StudySessionRecord,
} from "@/modules/advising/domain/models";
import type {
  StudySessionRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

const FUTURE_TOLERANCE_MINUTES = 5;

export interface StudyAnalysis {
  today: {
    studyMinutes: number;
    breakMinutes: number;
    wasteMinutes: number;
    productivityRate: number;
    averageFocus: number | null;
  };
  days: { day: string; minutes: number }[];
  subjects: { subject: string | null; minutes: number }[];
  totalStudyMinutes: number;
  productivityRate: number;
  averageFocus: number | null;
}

function ownerIdOf(input: { studentId?: string; actor: Actor }): string {
  return input.studentId ?? input.actor.id;
}

export class RecordStudySessionUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly study: StudySessionRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    category: string;
    subject?: string | null;
    durationMinutes: number;
    focusLevel?: number | null;
    startedAt: Date;
    now?: Date;
  }): Promise<StudySessionRecord> {
    const ownerId = ownerIdOf(input);
    assertPlanWrite(input.actor, "study:write", ownerId);

    if (!STUDY_CATEGORIES.includes(input.category as (typeof STUDY_CATEGORIES)[number])) {
      throw new ValidationError("دسته‌بندی جلسه نامعتبر است");
    }

    if (input.durationMinutes < 1 || input.durationMinutes > 1440) {
      throw new ValidationError("مدت جلسه باید بین ۱ تا ۱۴۴۰ دقیقه باشد");
    }

    const now = input.now ?? new Date();
    const maxStartedAt = new Date(now.getTime() + FUTURE_TOLERANCE_MINUTES * 60 * 1000);
    if (input.startedAt.getTime() > maxStartedAt.getTime()) {
      throw new ValidationError("زمان شروع نباید بیش از ۵ دقیقه در آینده باشد");
    }

    const focusLevel = input.category === "study" ? input.focusLevel ?? null : null;

    return this.study.create({
      studentId: ownerId,
      category: input.category as StudyCategory,
      subject: input.subject ?? null,
      durationMinutes: input.durationMinutes,
      focusLevel,
      startedAt: input.startedAt,
    });
  }
}

export class GetStudyAnalysisUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly study: StudySessionRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    days?: number;
    now?: Date;
  }): Promise<StudyAnalysis> {
    const ownerId = ownerIdOf(input);
    await assertPlanRead(this.users, input.actor, ownerId);

    const now = input.now ?? new Date();
    const days = Math.min(30, Math.max(1, input.days ?? 7));

    const from = new Date(
      startOfStudyDay(now).getTime() - (days - 1) * 24 * 60 * 60 * 1000,
    );
    const to = now;

    const rows = await this.study.listByStudentInRange(ownerId, from, to);
    const todayKey = studyDayKey(now);

    const todayRows = rows.filter((r) => studyDayKey(r.startedAt) === todayKey);
    const { study, break: breakMin, waste } = summarizeMinutes(todayRows);

    const series = perDaySeries(rows, from, days);
    const subjects = perSubjectTotals(rows);
    const totalStudyMinutes = rows
      .filter((r) => r.category === "study")
      .reduce((sum, r) => sum + r.durationMinutes, 0);

    return {
      today: {
        studyMinutes: study,
        breakMinutes: breakMin,
        wasteMinutes: waste,
        productivityRate: productivityRate(study, breakMin, waste),
        averageFocus: averageFocus(todayRows),
      },
      days: series,
      subjects,
      totalStudyMinutes,
      productivityRate: productivityRate(study, breakMin, waste),
      averageFocus: averageFocus(rows),
    };
  }
}
