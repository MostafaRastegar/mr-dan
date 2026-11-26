/**
 * In-memory catalog fakes for the admin use-case tests.
 *
 * One shared store behind two ports: the admin port sees retired rows, the
 * reader port returns active rows only. Unique conflicts throw `SlugConflictError`.
 */

import {
  NotFoundError,
  SlugConflictError,
  ValidationError,
} from "@/modules/advising/domain/errors";
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
  CatalogRepositoryPort,
  PageQuery,
} from "@/modules/advising/domain/ports";

interface Store {
  seq: number;
  fields: Map<string, FieldRow>;
  grades: Map<string, GradeRow>;
  subjects: Map<string, SubjectRow>;
  books: Map<string, BookRow>;
  needs: Map<string, Need>;
  exams: Map<string, Exam>;
  chapters: Map<string, Chapter>;
}

function nextId(store: Store, prefix: string): string {
  store.seq += 1;
  return `${prefix}-${store.seq}`;
}

function paginate<T>(rows: T[], query: PageQuery): Page<T> {
  const start = (query.page - 1) * query.pageSize;
  return {
    items: rows.slice(start, start + query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    total: rows.length,
  };
}

function bySortOrder<T extends { sortOrder: number; id: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
}

export class FakeCatalogAdminRepository implements CatalogAdminRepositoryPort {
  lastQuery: PageQuery | null = null;

  constructor(private readonly store: Store) {}

  async listFields(query: PageQuery): Promise<Page<FieldRow>> {
    this.lastQuery = query;
    return paginate(bySortOrder([...this.store.fields.values()]), query);
  }

  async listGrades(query: PageQuery): Promise<Page<GradeRow>> {
    this.lastQuery = query;
    return paginate(bySortOrder([...this.store.grades.values()]), query);
  }

  async listSubjects(query: PageQuery): Promise<Page<SubjectRow>> {
    this.lastQuery = query;
    return paginate(bySortOrder([...this.store.subjects.values()]), query);
  }

  async listBooks(query: PageQuery): Promise<Page<BookRow>> {
    this.lastQuery = query;
    return paginate(bySortOrder([...this.store.books.values()]), query);
  }

  async listNeeds(query: PageQuery): Promise<Page<Need>> {
    this.lastQuery = query;
    return paginate([...this.store.needs.values()], query);
  }

  async listExams(query: PageQuery): Promise<Page<Exam>> {
    this.lastQuery = query;
    return paginate([...this.store.exams.values()], query);
  }

  async listChapters(query: PageQuery): Promise<Page<Chapter>> {
    this.lastQuery = query;
    return paginate([...this.store.chapters.values()], query);
  }

  async findFieldByLabel(label: string): Promise<FieldRow | null> {
    return (
      [...this.store.fields.values()].find((row) => row.label === label) ?? null
    );
  }

  async findGradeByLabel(label: string): Promise<GradeRow | null> {
    return (
      [...this.store.grades.values()].find((row) => row.label === label) ?? null
    );
  }

  async findSubjectBySlug(slug: string): Promise<SubjectRow | null> {
    return (
      [...this.store.subjects.values()].find((row) => row.slug === slug) ?? null
    );
  }

  async findBookBySlug(slug: string): Promise<BookRow | null> {
    return (
      [...this.store.books.values()].find((row) => row.slug === slug) ?? null
    );
  }

  async findNeedByCode(code: string): Promise<Need | null> {
    return [...this.store.needs.values()].find((row) => row.code === code) ?? null;
  }

  async findExamByCode(code: string): Promise<Exam | null> {
    return [...this.store.exams.values()].find((row) => row.code === code) ?? null;
  }

  async findChapterByKey(input: {
    subject: string;
    field: string;
    grade: string;
    number: number;
  }): Promise<Chapter | null> {
    return (
      [...this.store.chapters.values()].find(
        (row) =>
          row.subject === input.subject &&
          row.field === input.field &&
          row.grade === input.grade &&
          row.number === input.number,
      ) ?? null
    );
  }

  async upsertField(input: {
    id?: string;
    label: string;
    sortOrder?: number;
  }): Promise<FieldRow> {
    if (input.id) {
      const row = this.store.fields.get(input.id);
      if (!row) throw new NotFoundError("رشته");
      const next = {
        ...row,
        label: input.label,
        sortOrder: input.sortOrder ?? row.sortOrder,
      };
      this.store.fields.set(input.id, next);
      return next;
    }
    if (await this.findFieldByLabel(input.label)) throw new SlugConflictError();
    const row: FieldRow = {
      id: nextId(this.store, "field"),
      label: input.label,
      active: true,
      sortOrder: input.sortOrder ?? this.store.fields.size,
    };
    this.store.fields.set(row.id, row);
    return row;
  }

  async upsertGrade(input: {
    id?: string;
    label: string;
    sortOrder?: number;
  }): Promise<GradeRow> {
    if (input.id) {
      const row = this.store.grades.get(input.id);
      if (!row) throw new NotFoundError("پایه");
      const next = {
        ...row,
        label: input.label,
        sortOrder: input.sortOrder ?? row.sortOrder,
      };
      this.store.grades.set(input.id, next);
      return next;
    }
    if (await this.findGradeByLabel(input.label)) throw new SlugConflictError();
    const row: GradeRow = {
      id: nextId(this.store, "grade"),
      label: input.label,
      active: true,
      sortOrder: input.sortOrder ?? this.store.grades.size,
    };
    this.store.grades.set(row.id, row);
    return row;
  }

  async upsertSubject(input: {
    id?: string;
    slug: string;
    label: string;
    fieldLabels: string[];
    gradeLabels: string[];
    sortOrder?: number;
  }): Promise<SubjectRow> {
    if (input.id) {
      const row = this.store.subjects.get(input.id);
      if (!row) throw new NotFoundError("درس");
      const next = {
        ...row,
        slug: input.slug,
        label: input.label,
        fieldLabels: input.fieldLabels,
        gradeLabels: input.gradeLabels,
        sortOrder: input.sortOrder ?? row.sortOrder,
      };
      this.store.subjects.set(input.id, next);
      return next;
    }
    if (await this.findSubjectBySlug(input.slug)) throw new SlugConflictError();
    const row: SubjectRow = {
      id: nextId(this.store, "subject"),
      slug: input.slug,
      label: input.label,
      fieldLabels: input.fieldLabels,
      gradeLabels: input.gradeLabels,
      active: true,
      sortOrder: input.sortOrder ?? this.store.subjects.size,
    };
    this.store.subjects.set(row.id, row);
    return row;
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
    if (input.id) {
      const row = this.store.books.get(input.id);
      if (!row) throw new NotFoundError("کتاب");
      const next = {
        ...row,
        slug: input.slug,
        title: input.title,
        author: input.author,
        fieldLabel: input.fieldLabel,
        codes: input.codes,
        sortOrder: input.sortOrder ?? row.sortOrder,
      };
      this.store.books.set(input.id, next);
      return next;
    }
    if (await this.findBookBySlug(input.slug)) throw new SlugConflictError();
    const row: BookRow = {
      id: nextId(this.store, "book"),
      slug: input.slug,
      title: input.title,
      author: input.author,
      fieldLabel: input.fieldLabel,
      codes: input.codes,
      active: true,
      sortOrder: input.sortOrder ?? this.store.books.size,
    };
    this.store.books.set(row.id, row);
    return row;
  }

  async upsertNeed(input: {
    id?: string;
    code?: string;
    label: string;
  }): Promise<Need> {
    if (input.id) {
      const row = this.store.needs.get(input.id);
      if (!row) throw new NotFoundError("نیاز");
      const next = {
        ...row,
        ...(input.code ? { code: input.code } : {}),
        label: input.label,
      };
      this.store.needs.set(input.id, next);
      return next;
    }
    if (!input.code) throw new ValidationError("کد الزامی است");
    if (await this.findNeedByCode(input.code)) throw new SlugConflictError();
    const row: Need = {
      id: nextId(this.store, "need"),
      code: input.code,
      label: input.label,
      active: true,
    };
    this.store.needs.set(row.id, row);
    return row;
  }

  async upsertExam(input: {
    id?: string;
    code?: string;
    label: string;
  }): Promise<Exam> {
    if (input.id) {
      const row = this.store.exams.get(input.id);
      if (!row) throw new NotFoundError("آزمون");
      const next = {
        ...row,
        ...(input.code ? { code: input.code } : {}),
        label: input.label,
      };
      this.store.exams.set(input.id, next);
      return next;
    }
    if (!input.code) throw new ValidationError("کد الزامی است");
    if (await this.findExamByCode(input.code)) throw new SlugConflictError();
    const row: Exam = {
      id: nextId(this.store, "exam"),
      code: input.code,
      label: input.label,
      active: true,
    };
    this.store.exams.set(row.id, row);
    return row;
  }

  async upsertChapter(input: {
    id?: string;
    subject: string;
    field: string;
    grade: string;
    number: number;
    title: string;
  }): Promise<Chapter> {
    if (input.id) {
      const row = this.store.chapters.get(input.id);
      if (!row) throw new NotFoundError("فصل");
      const next = {
        ...row,
        subject: input.subject,
        field: input.field,
        grade: input.grade,
        number: input.number,
        title: input.title,
      };
      this.store.chapters.set(input.id, next);
      return next;
    }
    if (
      await this.findChapterByKey({
        subject: input.subject,
        field: input.field,
        grade: input.grade,
        number: input.number,
      })
    ) {
      throw new SlugConflictError();
    }
    const row: Chapter = {
      id: nextId(this.store, "chapter"),
      subject: input.subject,
      field: input.field,
      grade: input.grade,
      number: input.number,
      title: input.title,
      active: true,
    };
    this.store.chapters.set(row.id, row);
    return row;
  }

  async retireField(id: string): Promise<void> {
    this.setActive(this.store.fields, id, false, "رشته");
  }

  async reactivateField(id: string): Promise<void> {
    this.setActive(this.store.fields, id, true, "رشته");
  }

  async retireGrade(id: string): Promise<void> {
    this.setActive(this.store.grades, id, false, "پایه");
  }

  async reactivateGrade(id: string): Promise<void> {
    this.setActive(this.store.grades, id, true, "پایه");
  }

  async retireSubject(id: string): Promise<void> {
    this.setActive(this.store.subjects, id, false, "درس");
  }

  async reactivateSubject(id: string): Promise<void> {
    this.setActive(this.store.subjects, id, true, "درس");
  }

  async retireBook(id: string): Promise<void> {
    this.setActive(this.store.books, id, false, "کتاب");
  }

  async reactivateBook(id: string): Promise<void> {
    this.setActive(this.store.books, id, true, "کتاب");
  }

  async retireNeed(id: string): Promise<void> {
    this.setActive(this.store.needs, id, false, "نیاز");
  }

  async reactivateNeed(id: string): Promise<void> {
    this.setActive(this.store.needs, id, true, "نیاز");
  }

  async retireExam(id: string): Promise<void> {
    this.setActive(this.store.exams, id, false, "آزمون");
  }

  async reactivateExam(id: string): Promise<void> {
    this.setActive(this.store.exams, id, true, "آزمون");
  }

  async retireChapter(id: string): Promise<void> {
    this.setActive(this.store.chapters, id, false, "فصل");
  }

  async reactivateChapter(id: string): Promise<void> {
    this.setActive(this.store.chapters, id, true, "فصل");
  }

  private setActive<T extends { id: string; active: boolean }>(
    store: Map<string, T>,
    id: string,
    active: boolean,
    resource: string,
  ): void {
    const row = store.get(id);
    if (!row) throw new NotFoundError(resource);
    store.set(id, { ...row, active });
  }
}

export class FakeCatalogReader implements CatalogRepositoryPort {
  constructor(private readonly store: Store) {}

  async listNeeds(): Promise<Need[]> {
    return [...this.store.needs.values()].filter((row) => row.active);
  }

  async listExams(): Promise<Exam[]> {
    return [...this.store.exams.values()].filter((row) => row.active);
  }

  async findNeed(id: string): Promise<Need | null> {
    const row = this.store.needs.get(id);
    return row && row.active ? row : null;
  }

  async findExam(id: string): Promise<Exam | null> {
    const row = this.store.exams.get(id);
    return row && row.active ? row : null;
  }

  async listFields(): Promise<FieldRow[]> {
    return bySortOrder(
      [...this.store.fields.values()].filter((row) => row.active),
    );
  }

  async listGrades(): Promise<GradeRow[]> {
    return bySortOrder(
      [...this.store.grades.values()].filter((row) => row.active),
    );
  }

  async listSubjects(): Promise<SubjectRow[]> {
    return bySortOrder(
      [...this.store.subjects.values()].filter((row) => row.active),
    );
  }

  async listSubjectLabels(): Promise<SubjectRow[]> {
    return bySortOrder([...this.store.subjects.values()]);
  }

  async listBooks(): Promise<BookRow[]> {
    return bySortOrder(
      [...this.store.books.values()].filter((row) => row.active),
    );
  }
}

export interface CatalogAdminFakes {
  admin: FakeCatalogAdminRepository;
  reader: FakeCatalogReader;
}

export function createCatalogAdminFakes(): CatalogAdminFakes {
  const store: Store = {
    seq: 0,
    fields: new Map(),
    grades: new Map(),
    subjects: new Map(),
    books: new Map(),
    needs: new Map(),
    exams: new Map(),
    chapters: new Map(),
  };
  return {
    admin: new FakeCatalogAdminRepository(store),
    reader: new FakeCatalogReader(store),
  };
}
