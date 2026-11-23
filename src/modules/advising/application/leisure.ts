/**
 * Leisure suggestion use case.
 *
 * Reads only the actor's own aggregates: study minutes for 7d and the 3d
 * subset (study rows only), then pending/overdue homework counts. The pure
 * rule set lives in `domain/leisure.ts`; the book pick in `domain/books.ts`.
 */

import { hasCapability } from "@/modules/advising/domain/capabilities";
import { ForbiddenError } from "@/modules/advising/domain/errors";
import { FIELDS, type FieldOfStudy } from "@/modules/advising/domain/models";
import { pickBook, type BookOffer } from "@/modules/advising/domain/books";
import {
  suggestLeisure,
  type LeisureInputs,
  type LeisureSuggestion,
} from "@/modules/advising/domain/leisure";
import type {
  HomeworkRepositoryPort,
  StudySessionRepositoryPort,
} from "@/modules/advising/domain/ports";
import {
  studyDayKey,
  summarizeMinutes,
} from "@/modules/advising/application/study-metrics";
import type { Actor } from "@/modules/advising/application/planning-access";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isFieldOfStudy(value: string | null | undefined): value is FieldOfStudy {
  return FIELDS.some((field) => field === value);
}

export interface LeisureOverview {
  suggestion: LeisureSuggestion;
  book: BookOffer;
  inputs: LeisureInputs;
}

export class GetLeisureSuggestionUseCase {
  constructor(
    private readonly study: StudySessionRepositoryPort,
    private readonly homework: HomeworkRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    today?: Date;
    fieldOfStudy?: string | null;
  }): Promise<LeisureOverview> {
    if (!hasCapability(input.actor.role, "leisure:read")) {
      throw new ForbiddenError();
    }

    const now = input.today ?? new Date();
    const from7 = new Date(now.getTime() - 7 * MS_PER_DAY);
    const from3 = new Date(now.getTime() - 3 * MS_PER_DAY);

    const rows = await this.study.listByStudentInRange(input.actor.id, from7, now);
    const recentRows = rows.filter((row) => row.startedAt.getTime() >= from3.getTime());

    const pending = await this.homework.listByStudent(input.actor.id, "pending");
    const todayKey = studyDayKey(now);
    const overdueHomework = pending.filter(
      (item) => studyDayKey(item.deadline) < todayKey,
    ).length;

    const inputs: LeisureInputs = {
      studyMinutes7d: summarizeMinutes(rows).study,
      studyMinutes3d: summarizeMinutes(recentRows).study,
      pendingHomework: pending.length,
      overdueHomework,
    };

    const suggestion = suggestLeisure(inputs);
    const book = pickBook({
      field: isFieldOfStudy(input.fieldOfStudy) ? input.fieldOfStudy : null,
      code: suggestion.code,
    });

    return { suggestion, book, inputs };
  }
}
