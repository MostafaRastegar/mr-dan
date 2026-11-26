/**
 * In-memory fakes for the six new advisor-program ports.
 *
 * One module, six classes. `seed(...)` on each pre-populates the store.
 * Mirrors Prisma semantics: unique conflicts throw `ConflictError`.
 */

import { ConflictError } from "@/modules/advising/domain/errors";
import type {
  BookRow,
  Chapter,
  Exam,
  FieldRow,
  GradeRow,
  Need,
  NewSchoolProgramEntry,
  NewStudyPlanEntry,
  NewSupplementaryCourse,
  SchoolProgramEntry,
  StudentExamResult,
  StudyPlan,
  StudyPlanEntry,
  SubjectRow,
  SupplementaryCourse,
} from "@/modules/advising/domain/models";
import type {
  CatalogRepositoryPort,
  ChapterRepositoryPort,
  SchoolProgramRepositoryPort,
  StudyPlanRepositoryPort,
  StudentExamResultRepositoryPort,
  SupplementaryCourseRepositoryPort,
} from "@/modules/advising/domain/ports";

let nowSeq = 0;
const now = () => new Date(Date.now() + nowSeq++);

export class FakeCatalogRepository implements CatalogRepositoryPort {
  private readonly needs = new Map<string, Need>();
  private readonly exams = new Map<string, Exam>();
  private readonly fields = new Map<string, FieldRow>();
  private readonly grades = new Map<string, GradeRow>();
  private readonly subjects = new Map<string, SubjectRow>();
  private readonly books = new Map<string, BookRow>();

  seed(
    needs: readonly Need[],
    exams: readonly Exam[],
    catalogs?: {
      fields?: readonly FieldRow[];
      grades?: readonly GradeRow[];
      subjects?: readonly SubjectRow[];
      books?: readonly BookRow[];
    },
  ): void {
    for (const need of needs) this.needs.set(need.id, need);
    for (const exam of exams) this.exams.set(exam.id, exam);
    for (const row of catalogs?.fields ?? []) this.fields.set(row.id, row);
    for (const row of catalogs?.grades ?? []) this.grades.set(row.id, row);
    for (const row of catalogs?.subjects ?? []) this.subjects.set(row.id, row);
    for (const row of catalogs?.books ?? []) this.books.set(row.id, row);
  }

  async listNeeds(): Promise<Need[]> {
    return [...this.needs.values()].filter((n) => n.active);
  }

  async listExams(): Promise<Exam[]> {
    return [...this.exams.values()].filter((e) => e.active);
  }

  async listFields(): Promise<FieldRow[]> {
    return [...this.fields.values()]
      .filter((row) => row.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listGrades(): Promise<GradeRow[]> {
    return [...this.grades.values()]
      .filter((row) => row.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listSubjects(): Promise<SubjectRow[]> {
    return [...this.subjects.values()]
      .filter((row) => row.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listSubjectLabels(): Promise<SubjectRow[]> {
    return [...this.subjects.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  async listBooks(): Promise<BookRow[]> {
    return [...this.books.values()]
      .filter((row) => row.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findNeed(id: string): Promise<Need | null> {
    const need = this.needs.get(id);
    return need && need.active ? need : null;
  }

  async findExam(id: string): Promise<Exam | null> {
    const exam = this.exams.get(id);
    return exam && exam.active ? exam : null;
  }
}

export class FakeChapterRepository implements ChapterRepositoryPort {
  private readonly chapters = new Map<string, Chapter>();

  seed(chapters: readonly Chapter[]): void {
    for (const chapter of chapters) this.chapters.set(chapter.id, chapter);
  }

  async listForSubject(input: {
    subject: string;
    grade: string | null;
    field: string | null;
  }): Promise<Chapter[]> {
    return [...this.chapters.values()].filter((chapter) => {
      if (!chapter.active) return false;
      if (chapter.subject !== input.subject) return false;
      if (input.grade === null || chapter.grade !== input.grade) return false;
      if (chapter.field !== "" && chapter.field !== input.field) return false;
      return true;
    });
  }

  async findByIds(ids: readonly string[]): Promise<Chapter[]> {
    return ids
      .map((id) => this.chapters.get(id))
      .filter((chapter): chapter is Chapter => chapter !== undefined);
  }
}

export class FakeSchoolProgramRepository implements SchoolProgramRepositoryPort {
  private readonly rows = new Map<string, SchoolProgramEntry>();
  private sequence = 0;

  seed(entries: readonly SchoolProgramEntry[]): void {
    for (const entry of entries) this.rows.set(entry.id, entry);
  }

  async listByStudent(studentId: string): Promise<SchoolProgramEntry[]> {
    return [...this.rows.values()].filter((r) => r.studentId === studentId);
  }

  async create(input: NewSchoolProgramEntry): Promise<SchoolProgramEntry> {
    const duplicate = [...this.rows.values()].find(
      (r) =>
        r.studentId === input.studentId &&
        r.dayOfWeek === input.dayOfWeek &&
        r.subject === input.subject,
    );
    if (duplicate) throw new ConflictError();

    this.sequence += 1;
    const entry: SchoolProgramEntry = {
      id: `sp-${this.sequence}`,
      studentId: input.studentId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes: input.minutes,
      createdAt: now(),
      updatedAt: now(),
    };
    this.rows.set(entry.id, entry);
    return entry;
  }

  async delete(input: { id: string; studentId: string }): Promise<void> {
    const entry = this.rows.get(input.id);
    if (entry && entry.studentId === input.studentId) {
      this.rows.delete(input.id);
    }
  }
}

export class FakeStudyPlanRepository implements StudyPlanRepositoryPort {
  private readonly plans = new Map<string, StudyPlan>();
  private sequence = 0;

  seed(plans: readonly StudyPlan[]): void {
    for (const plan of plans) this.plans.set(plan.studentId, plan);
  }

  async findForStudent(studentId: string): Promise<StudyPlan | null> {
    return this.plans.get(studentId) ?? null;
  }

  async upsertHeader(input: {
    studentId: string;
    counselorId: string;
    testsTarget: number;
  }): Promise<StudyPlan> {
    const existing = this.plans.get(input.studentId);
    if (existing) {
      const next: StudyPlan = {
        ...existing,
        counselorId: input.counselorId,
        testsTarget: input.testsTarget,
        updatedAt: now(),
      };
      this.plans.set(input.studentId, next);
      return next;
    }

    this.sequence += 1;
    const plan: StudyPlan = {
      id: `plan-${this.sequence}`,
      studentId: input.studentId,
      counselorId: input.counselorId,
      testsTarget: input.testsTarget,
      entries: [],
      createdAt: now(),
      updatedAt: now(),
    };
    this.plans.set(input.studentId, plan);
    return plan;
  }

  async upsertEntry(input: NewStudyPlanEntry): Promise<StudyPlanEntry> {
    const plan = this.plans.get(input.studentId);
    if (!plan) throw new ConflictError("plan not found for student");

    const duplicate = plan.entries.find(
      (e) =>
        e.dayOfWeek === input.dayOfWeek && e.subject === input.subject,
    );
    if (duplicate) throw new ConflictError();

    this.sequence += 1;
    const entry: StudyPlanEntry = {
      id: `spe-${this.sequence}`,
      studentId: input.studentId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes: input.minutes,
      chapterIds: input.chapterIds,
      note: input.note,
      createdAt: now(),
      updatedAt: now(),
    };
    plan.entries.push(entry);
    plan.updatedAt = now();
    return entry;
  }

  async deleteEntry(input: {
    studentId: string;
    entryId: string;
  }): Promise<void> {
    const plan = this.plans.get(input.studentId);
    if (!plan) return;
    const idx = plan.entries.findIndex((e) => e.id === input.entryId);
    if (idx >= 0) plan.entries.splice(idx, 1);
  }
}

export class FakeStudentExamResultRepository
  implements StudentExamResultRepositoryPort
{
  private readonly rows = new Map<string, StudentExamResult>();
  private sequence = 0;

  seed(results: readonly StudentExamResult[]): void {
    for (const result of results)
      this.rows.set(`${result.studentId}:${result.examId}`, result);
  }

  async listRecent(
    studentId: string,
    take: number,
  ): Promise<StudentExamResult[]> {
    return [...this.rows.values()]
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take);
  }

  async upsert(input: {
    studentId: string;
    examId: string;
    taraz: number;
  }): Promise<StudentExamResult> {
    const key = `${input.studentId}:${input.examId}`;
    const existing = this.rows.get(key);
    if (existing) {
      const next: StudentExamResult = {
        ...existing,
        taraz: input.taraz,
        updatedAt: now(),
      };
      this.rows.set(key, next);
      return next;
    }

    this.sequence += 1;
    const result: StudentExamResult = {
      id: `ser-${this.sequence}`,
      studentId: input.studentId,
      examId: input.examId,
      taraz: input.taraz,
      createdAt: now(),
      updatedAt: now(),
    };
    this.rows.set(key, result);
    return result;
  }
}

export class FakeSupplementaryCourseRepository
  implements SupplementaryCourseRepositoryPort
{
  private readonly rows = new Map<string, SupplementaryCourse>();
  private sequence = 0;

  seed(courses: readonly SupplementaryCourse[]): void {
    for (const course of courses) this.rows.set(course.id, course);
  }

  async listByStudent(studentId: string): Promise<SupplementaryCourse[]> {
    return [...this.rows.values()].filter((r) => r.studentId === studentId);
  }

  async create(input: NewSupplementaryCourse): Promise<SupplementaryCourse> {
    this.sequence += 1;
    const course: SupplementaryCourse = {
      id: `sc-${this.sequence}`,
      studentId: input.studentId,
      title: input.title,
      mode: input.mode,
      weeklyMinutes: input.weeklyMinutes,
      createdAt: now(),
    };
    this.rows.set(course.id, course);
    return course;
  }

  async delete(input: { id: string; studentId: string }): Promise<void> {
    const course = this.rows.get(input.id);
    if (course && course.studentId === input.studentId) {
      this.rows.delete(input.id);
    }
  }
}
