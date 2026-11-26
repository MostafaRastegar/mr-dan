/**
 * Admin catalog use cases.
 *
 * All writes validate at the boundary, reject duplicate natural keys
 * (`slug_conflict`), and retire instead of hard-deleting. The admin list keeps
 * retired rows; the active option lists do not.
 */

import { SlugConflictError, ValidationError } from "../domain/errors";
import type {
  BookRow,
  Chapter,
  Page,
  SubjectRow,
} from "../domain/models";
import type {
  CatalogAdminRepositoryPort,
  PageQuery,
} from "../domain/ports";
import { clampPage } from "./pagination";

export type LabelCatalogEntity = "fields" | "grades" | "needs" | "exams";

export type LabelRow = { id: string; label: string; active: boolean };

function requireText(value: string, message: string): string {
  const text = value.trim();
  if (!text) throw new ValidationError(message);
  return text;
}

function cleanList(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function assertUnique(
  existing: { id: string } | null,
  currentId: string | undefined,
): void {
  if (existing && existing.id !== currentId) throw new SlugConflictError();
}

export class ManageLabelCatalogUseCase {
  constructor(
    private readonly repo: CatalogAdminRepositoryPort,
    private readonly entity: LabelCatalogEntity,
  ) {}

  async list(input?: {
    page?: number;
    pageSize?: number;
  }): Promise<Page<LabelRow>> {
    const query: PageQuery = clampPage(input);
    switch (this.entity) {
      case "fields":
        return this.repo.listFields(query);
      case "grades":
        return this.repo.listGrades(query);
      case "needs":
        return this.repo.listNeeds(query);
      case "exams":
        return this.repo.listExams(query);
    }
  }

  async create(input: { label: string; code?: string }): Promise<{ id: string }> {
    const label = requireText(input.label, "برچسب الزامی است");
    switch (this.entity) {
      case "fields": {
        assertUnique(await this.repo.findFieldByLabel(label), undefined);
        const row = await this.repo.upsertField({ label });
        return { id: row.id };
      }
      case "grades": {
        assertUnique(await this.repo.findGradeByLabel(label), undefined);
        const row = await this.repo.upsertGrade({ label });
        return { id: row.id };
      }
      case "needs": {
        const code = requireText(input.code?.trim() || label, "کد الزامی است");
        assertUnique(await this.repo.findNeedByCode(code), undefined);
        const row = await this.repo.upsertNeed({ code, label });
        return { id: row.id };
      }
      case "exams": {
        const code = requireText(input.code?.trim() || label, "کد الزامی است");
        assertUnique(await this.repo.findExamByCode(code), undefined);
        const row = await this.repo.upsertExam({ code, label });
        return { id: row.id };
      }
    }
  }

  async update(input: {
    id: string;
    label: string;
    code?: string;
  }): Promise<{ id: string }> {
    const label = requireText(input.label, "برچسب الزامی است");
    switch (this.entity) {
      case "fields": {
        assertUnique(await this.repo.findFieldByLabel(label), input.id);
        const row = await this.repo.upsertField({ id: input.id, label });
        return { id: row.id };
      }
      case "grades": {
        assertUnique(await this.repo.findGradeByLabel(label), input.id);
        const row = await this.repo.upsertGrade({ id: input.id, label });
        return { id: row.id };
      }
      case "needs": {
        const code = input.code?.trim();
        if (code) assertUnique(await this.repo.findNeedByCode(code), input.id);
        const row = await this.repo.upsertNeed({
          id: input.id,
          label,
          ...(code ? { code } : {}),
        });
        return { id: row.id };
      }
      case "exams": {
        const code = input.code?.trim();
        if (code) assertUnique(await this.repo.findExamByCode(code), input.id);
        const row = await this.repo.upsertExam({
          id: input.id,
          label,
          ...(code ? { code } : {}),
        });
        return { id: row.id };
      }
    }
  }

  async retire(id: string): Promise<void> {
    switch (this.entity) {
      case "fields":
        return this.repo.retireField(id);
      case "grades":
        return this.repo.retireGrade(id);
      case "needs":
        return this.repo.retireNeed(id);
      case "exams":
        return this.repo.retireExam(id);
    }
  }

  async reactivate(id: string): Promise<void> {
    switch (this.entity) {
      case "fields":
        return this.repo.reactivateField(id);
      case "grades":
        return this.repo.reactivateGrade(id);
      case "needs":
        return this.repo.reactivateNeed(id);
      case "exams":
        return this.repo.reactivateExam(id);
    }
  }
}

export class ManageSubjectsUseCase {
  constructor(private readonly repo: CatalogAdminRepositoryPort) {}

  async list(input?: {
    page?: number;
    pageSize?: number;
  }): Promise<Page<SubjectRow>> {
    return this.repo.listSubjects(clampPage(input));
  }

  async create(input: {
    slug: string;
    label: string;
    fieldLabels: string[];
    gradeLabels: string[];
  }): Promise<{ id: string }> {
    const slug = requireText(input.slug, "نامک الزامی است");
    const label = requireText(input.label, "برچسب الزامی است");
    assertUnique(await this.repo.findSubjectBySlug(slug), undefined);
    const row = await this.repo.upsertSubject({
      slug,
      label,
      fieldLabels: cleanList(input.fieldLabels),
      gradeLabels: cleanList(input.gradeLabels),
    });
    return { id: row.id };
  }

  async update(input: {
    id: string;
    slug: string;
    label: string;
    fieldLabels: string[];
    gradeLabels: string[];
  }): Promise<{ id: string }> {
    const slug = requireText(input.slug, "نامک الزامی است");
    const label = requireText(input.label, "برچسب الزامی است");
    assertUnique(await this.repo.findSubjectBySlug(slug), input.id);
    const row = await this.repo.upsertSubject({
      id: input.id,
      slug,
      label,
      fieldLabels: cleanList(input.fieldLabels),
      gradeLabels: cleanList(input.gradeLabels),
    });
    return { id: row.id };
  }

  async retire(id: string): Promise<void> {
    await this.repo.retireSubject(id);
  }

  async reactivate(id: string): Promise<void> {
    await this.repo.reactivateSubject(id);
  }
}

export class ManageBooksUseCase {
  constructor(private readonly repo: CatalogAdminRepositoryPort) {}

  async list(input?: {
    page?: number;
    pageSize?: number;
  }): Promise<Page<BookRow>> {
    return this.repo.listBooks(clampPage(input));
  }

  async create(input: {
    slug: string;
    title: string;
    author: string;
    fieldLabel: string | null;
    codes: string[];
  }): Promise<{ id: string }> {
    const slug = requireText(input.slug, "نامک الزامی است");
    const title = requireText(input.title, "عنوان الزامی است");
    const author = requireText(input.author, "نویسنده الزامی است");
    assertUnique(await this.repo.findBookBySlug(slug), undefined);
    const row = await this.repo.upsertBook({
      slug,
      title,
      author,
      fieldLabel: input.fieldLabel?.trim() || null,
      codes: cleanList(input.codes),
    });
    return { id: row.id };
  }

  async update(input: {
    id: string;
    slug: string;
    title: string;
    author: string;
    fieldLabel: string | null;
    codes: string[];
  }): Promise<{ id: string }> {
    const slug = requireText(input.slug, "نامک الزامی است");
    const title = requireText(input.title, "عنوان الزامی است");
    const author = requireText(input.author, "نویسنده الزامی است");
    assertUnique(await this.repo.findBookBySlug(slug), input.id);
    const row = await this.repo.upsertBook({
      id: input.id,
      slug,
      title,
      author,
      fieldLabel: input.fieldLabel?.trim() || null,
      codes: cleanList(input.codes),
    });
    return { id: row.id };
  }

  async retire(id: string): Promise<void> {
    await this.repo.retireBook(id);
  }

  async reactivate(id: string): Promise<void> {
    await this.repo.reactivateBook(id);
  }
}

export class ManageChaptersUseCase {
  constructor(private readonly repo: CatalogAdminRepositoryPort) {}

  async list(input?: {
    page?: number;
    pageSize?: number;
  }): Promise<Page<Chapter>> {
    return this.repo.listChapters(clampPage(input));
  }

  async create(input: {
    subject: string;
    field: string;
    grade: string;
    number: number;
    title: string;
  }): Promise<{ id: string }> {
    const data = chapterData(input);
    assertUnique(await this.repo.findChapterByKey(data), undefined);
    const row = await this.repo.upsertChapter(data);
    return { id: row.id };
  }

  async update(input: {
    id: string;
    subject: string;
    field: string;
    grade: string;
    number: number;
    title: string;
  }): Promise<{ id: string }> {
    const data = chapterData(input);
    assertUnique(await this.repo.findChapterByKey(data), input.id);
    const row = await this.repo.upsertChapter({ id: input.id, ...data });
    return { id: row.id };
  }

  async retire(id: string): Promise<void> {
    await this.repo.retireChapter(id);
  }

  async reactivate(id: string): Promise<void> {
    await this.repo.reactivateChapter(id);
  }
}

function chapterData(input: {
  subject: string;
  field: string;
  grade: string;
  number: number;
  title: string;
}): {
  subject: string;
  field: string;
  grade: string;
  number: number;
  title: string;
} {
  const subject = requireText(input.subject, "درس الزامی است");
  const grade = requireText(input.grade, "پایه الزامی است");
  const title = requireText(input.title, "عنوان الزامی است");
  if (!Number.isInteger(input.number) || input.number < 1) {
    throw new ValidationError("شماره فصل باید عددی مثبت باشد");
  }
  return { subject, field: input.field.trim(), grade, number: input.number, title };
}
