/**
 * Leisure suggestion use case.
 *
 * Reads only the actor's own aggregates: free-time budget minutes and planned
 * homework minutes over the last seven Iran days, then pending/overdue homework
 * counts. The pure rule set lives in `domain/leisure.ts`; the book pick in
 * `domain/books.ts`.
 */

import { hasCapability } from "@/modules/advising/domain/capabilities";
import { ForbiddenError } from "@/modules/advising/domain/errors";
import { FIELDS, type FieldOfStudy } from "@/modules/advising/domain/models";
import { pickBook, type BookOffer } from "@/modules/advising/domain/books";
import { iranDayKey, shiftDayKey } from "@/modules/advising/domain/day-key";
import {
  suggestLeisure,
  type LeisureInputs,
  type LeisureSuggestion,
} from "@/modules/advising/domain/leisure";
import type {
  FreeTimeBudgetRepositoryPort,
  HomeworkPlanRepositoryPort,
  HomeworkRepositoryPort,
} from "@/modules/advising/domain/ports";
import type { Actor } from "@/modules/advising/application/planning-access";

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
    private readonly budget: FreeTimeBudgetRepositoryPort,
    private readonly plans: HomeworkPlanRepositoryPort,
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

    const todayKey = iranDayKey(input.today ?? new Date());
    const fromKey = shiftDayKey(todayKey, -6);

    const freeMinutes7d = (await this.budget.listInRange(input.actor.id, fromKey, todayKey)).reduce(
      (sum, row) => sum + row.freeMinutes,
      0,
    );
    const plannedMinutes7d = (
      await this.plans.listByStudentInRange(input.actor.id, fromKey, todayKey)
    ).reduce((sum, row) => sum + row.plannedMinutes, 0);

    const pending = await this.homework.listByStudent(input.actor.id, "pending");
    const overdueHomework = pending.filter(
      (item) => iranDayKey(item.deadline) < todayKey,
    ).length;

    const inputs: LeisureInputs = {
      plannedMinutes7d,
      freeMinutes7d,
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
