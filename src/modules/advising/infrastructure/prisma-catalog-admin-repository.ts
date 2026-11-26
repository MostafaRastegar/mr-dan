/**
 * Prisma implementation of CatalogAdminRepositoryPort.
 *
 * Admin lists include retired rows (paginated, skip/take); writes are upserts
 * by id or natural key. `P2002` maps to `slug_conflict` and `P2025` to
 * `not_found`, both keeping `cause`. No hard delete: retire is `active=false`.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { NotFoundError, SlugConflictError, ValidationError } from "@/modules/advising/domain/errors";
import type {
  BookRow,
  Chapter,
  Exam,
  FieldRow,
  GradeRow,
  Need,
  Page,
  SubjectRow,
} from "@/modules/advising/domain/models";
import type {
  CatalogAdminRepositoryPort,
  PageQuery,
} from "@/modules/advising/domain/ports";

const FIELD_SELECT = {
  id: true,
  label: true,
  active: true,
  sortOrder: true,
} as const;

const SUBJECT_SELECT = {
  id: true,
  slug: true,
  label: true,
  fieldLabels: true,
  gradeLabels: true,
  active: true,
  sortOrder: true,
} as const;

const BOOK_SELECT = {
  id: true,
  slug: true,
  title: true,
  author: true,
  fieldLabel: true,
  codes: true,
  active: true,
  sortOrder: true,
} as const;

const NEED_SELECT = {
  id: true,
  code: true,
  label: true,
  active: true,
} as const;

const EXAM_SELECT = {
  id: true,
  code: true,
  label: true,
  active: true,
} as const;

const CHAPTER_SELECT = {
  id: true,
  subject: true,
  field: true,
  grade: true,
  number: true,
  title: true,
  active: true,
} as const;

function range(query: PageQuery): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

function pageOf<T>(items: T[], query: PageQuery, total: number): Page<T> {
  return { items, page: query.page, pageSize: query.pageSize, total };
}

function isP2002(error: unknown): error is { code: "P2002" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function isP2025(error: unknown): error is { code: "P2025" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export class PrismaCatalogAdminRepository implements CatalogAdminRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listFields(query: PageQuery): Promise<Page<FieldRow>> {
    const [items, total] = await Promise.all([
      this.client.field.findMany({
        select: FIELD_SELECT,
        orderBy: { sortOrder: "asc" },
        ...range(query),
      }),
      this.client.field.count(),
    ]);
    return pageOf(items, query, total);
  }

  async listGrades(query: PageQuery): Promise<Page<GradeRow>> {
    const [items, total] = await Promise.all([
      this.client.grade.findMany({
        select: FIELD_SELECT,
        orderBy: { sortOrder: "asc" },
        ...range(query),
      }),
      this.client.grade.count(),
    ]);
    return pageOf(items, query, total);
  }

  async listSubjects(query: PageQuery): Promise<Page<SubjectRow>> {
    const [items, total] = await Promise.all([
      this.client.subject.findMany({
        select: SUBJECT_SELECT,
        orderBy: { sortOrder: "asc" },
        ...range(query),
      }),
      this.client.subject.count(),
    ]);
    return pageOf(items, query, total);
  }

  async listBooks(query: PageQuery): Promise<Page<BookRow>> {
    const [items, total] = await Promise.all([
      this.client.book.findMany({
        select: BOOK_SELECT,
        orderBy: { sortOrder: "asc" },
        ...range(query),
      }),
      this.client.book.count(),
    ]);
    return pageOf(items, query, total);
  }

  async listNeeds(query: PageQuery): Promise<Page<Need>> {
    const [items, total] = await Promise.all([
      this.client.need.findMany({
        select: NEED_SELECT,
        orderBy: { label: "asc" },
        ...range(query),
      }),
      this.client.need.count(),
    ]);
    return pageOf(items, query, total);
  }

  async listExams(query: PageQuery): Promise<Page<Exam>> {
    const [items, total] = await Promise.all([
      this.client.exam.findMany({
        select: EXAM_SELECT,
        orderBy: { label: "asc" },
        ...range(query),
      }),
      this.client.exam.count(),
    ]);
    return pageOf(items, query, total);
  }

  async listChapters(query: PageQuery): Promise<Page<Chapter>> {
    const [items, total] = await Promise.all([
      this.client.chapter.findMany({
        select: CHAPTER_SELECT,
        orderBy: [{ subject: "asc" }, { grade: "asc" }, { number: "asc" }],
        ...range(query),
      }),
      this.client.chapter.count(),
    ]);
    return pageOf(items, query, total);
  }

  async findFieldByLabel(label: string): Promise<FieldRow | null> {
    return this.client.field.findUnique({
      where: { label },
      select: FIELD_SELECT,
    });
  }

  async findGradeByLabel(label: string): Promise<GradeRow | null> {
    return this.client.grade.findUnique({
      where: { label },
      select: FIELD_SELECT,
    });
  }

  async findSubjectBySlug(slug: string): Promise<SubjectRow | null> {
    return this.client.subject.findUnique({
      where: { slug },
      select: SUBJECT_SELECT,
    });
  }

  async findBookBySlug(slug: string): Promise<BookRow | null> {
    return this.client.book.findUnique({
      where: { slug },
      select: BOOK_SELECT,
    });
  }

  async findNeedByCode(code: string): Promise<Need | null> {
    return this.client.need.findUnique({
      where: { code },
      select: NEED_SELECT,
    });
  }

  async findExamByCode(code: string): Promise<Exam | null> {
    return this.client.exam.findUnique({
      where: { code },
      select: EXAM_SELECT,
    });
  }

  async findChapterByKey(input: {
    subject: string;
    field: string;
    grade: string;
    number: number;
  }): Promise<Chapter | null> {
    return this.client.chapter.findUnique({
      where: {
        subject_field_grade_number: {
          subject: input.subject,
          field: input.field,
          grade: input.grade,
          number: input.number,
        },
      },
      select: CHAPTER_SELECT,
    });
  }

  async upsertField(input: {
    id?: string;
    label: string;
    sortOrder?: number;
  }): Promise<FieldRow> {
    const data = {
      label: input.label,
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };
    try {
      if (input.id) {
        return await this.client.field.update({
          where: { id: input.id },
          data,
          select: FIELD_SELECT,
        });
      }
      return await this.client.field.create({ data, select: FIELD_SELECT });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("رشته", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async upsertGrade(input: {
    id?: string;
    label: string;
    sortOrder?: number;
  }): Promise<GradeRow> {
    const data = {
      label: input.label,
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };
    try {
      if (input.id) {
        return await this.client.grade.update({
          where: { id: input.id },
          data,
          select: FIELD_SELECT,
        });
      }
      return await this.client.grade.create({ data, select: FIELD_SELECT });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("پایه", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async upsertSubject(input: {
    id?: string;
    slug: string;
    label: string;
    fieldLabels: string[];
    gradeLabels: string[];
    sortOrder?: number;
  }): Promise<SubjectRow> {
    const data = {
      slug: input.slug,
      label: input.label,
      fieldLabels: input.fieldLabels,
      gradeLabels: input.gradeLabels,
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };
    try {
      if (input.id) {
        return await this.client.subject.update({
          where: { id: input.id },
          data,
          select: SUBJECT_SELECT,
        });
      }
      return await this.client.subject.create({ data, select: SUBJECT_SELECT });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("درس", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async upsertBook(input: {
    id?: string;
    slug: string;
    title: string;
    author: string;
    fieldLabel: string | null;
    codes: string[];
    sortOrder?: number;
  }): Promise<BookRow> {
    const data = {
      slug: input.slug,
      title: input.title,
      author: input.author,
      fieldLabel: input.fieldLabel,
      codes: input.codes,
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };
    try {
      if (input.id) {
        return await this.client.book.update({
          where: { id: input.id },
          data,
          select: BOOK_SELECT,
        });
      }
      return await this.client.book.create({ data, select: BOOK_SELECT });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("کتاب", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async upsertNeed(input: {
    id?: string;
    code?: string;
    label: string;
  }): Promise<Need> {
    try {
      if (input.id) {
        return await this.client.need.update({
          where: { id: input.id },
          data: {
            label: input.label,
            ...(input.code ? { code: input.code } : {}),
          },
          select: NEED_SELECT,
        });
      }
      if (!input.code) throw new ValidationError("کد الزامی است");
      return await this.client.need.create({
        data: { code: input.code, label: input.label },
        select: NEED_SELECT,
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("نیاز", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async upsertExam(input: {
    id?: string;
    code?: string;
    label: string;
  }): Promise<Exam> {
    try {
      if (input.id) {
        return await this.client.exam.update({
          where: { id: input.id },
          data: {
            label: input.label,
            ...(input.code ? { code: input.code } : {}),
          },
          select: EXAM_SELECT,
        });
      }
      if (!input.code) throw new ValidationError("کد الزامی است");
      return await this.client.exam.create({
        data: { code: input.code, label: input.label },
        select: EXAM_SELECT,
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("آزمون", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async upsertChapter(input: {
    id?: string;
    subject: string;
    field: string;
    grade: string;
    number: number;
    title: string;
  }): Promise<Chapter> {
    const data = {
      subject: input.subject,
      field: input.field,
      grade: input.grade,
      number: input.number,
      title: input.title,
    };
    try {
      if (input.id) {
        return await this.client.chapter.update({
          where: { id: input.id },
          data,
          select: CHAPTER_SELECT,
        });
      }
      return await this.client.chapter.create({
        data,
        select: CHAPTER_SELECT,
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("فصل", error);
      if (isP2002(error)) throw new SlugConflictError(error);
      throw error;
    }
  }

  async retireField(id: string): Promise<void> {
    await this.setFieldActive(id, false);
  }

  async reactivateField(id: string): Promise<void> {
    await this.setFieldActive(id, true);
  }

  async retireGrade(id: string): Promise<void> {
    await this.setGradeActive(id, false);
  }

  async reactivateGrade(id: string): Promise<void> {
    await this.setGradeActive(id, true);
  }

  async retireSubject(id: string): Promise<void> {
    await this.setSubjectActive(id, false);
  }

  async reactivateSubject(id: string): Promise<void> {
    await this.setSubjectActive(id, true);
  }

  async retireBook(id: string): Promise<void> {
    await this.setBookActive(id, false);
  }

  async reactivateBook(id: string): Promise<void> {
    await this.setBookActive(id, true);
  }

  async retireNeed(id: string): Promise<void> {
    await this.setNeedActive(id, false);
  }

  async reactivateNeed(id: string): Promise<void> {
    await this.setNeedActive(id, true);
  }

  async retireExam(id: string): Promise<void> {
    await this.setExamActive(id, false);
  }

  async reactivateExam(id: string): Promise<void> {
    await this.setExamActive(id, true);
  }

  async retireChapter(id: string): Promise<void> {
    await this.setChapterActive(id, false);
  }

  async reactivateChapter(id: string): Promise<void> {
    await this.setChapterActive(id, true);
  }

  private async setFieldActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.field.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("رشته", error);
      throw error;
    }
  }

  private async setGradeActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.grade.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("پایه", error);
      throw error;
    }
  }

  private async setSubjectActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.subject.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("درس", error);
      throw error;
    }
  }

  private async setBookActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.book.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("کتاب", error);
      throw error;
    }
  }

  private async setNeedActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.need.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("نیاز", error);
      throw error;
    }
  }

  private async setExamActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.exam.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("آزمون", error);
      throw error;
    }
  }

  private async setChapterActive(id: string, active: boolean): Promise<void> {
    try {
      await this.client.chapter.update({
        where: { id },
        data: { active },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("فصل", error);
      throw error;
    }
  }
}
