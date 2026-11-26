/**
 * Runtime catalog options for forms and label rendering.
 *
 * `subjects` is active-only (option lists); `subjectLabels` covers retired rows
 * too so an old stored slug keeps rendering its Persian label.
 */

import { subjectLabelMap } from "@/modules/advising/domain/catalog";
import type {
  FieldRow,
  GradeRow,
  SubjectRow,
} from "@/modules/advising/domain/models";
import type { CatalogRepositoryPort } from "@/modules/advising/domain/ports";

export interface CatalogOptions {
  fields: FieldRow[];
  grades: GradeRow[];
  subjects: SubjectRow[];
  subjectLabels: Record<string, string>;
}

export class GetCatalogOptionsUseCase {
  constructor(private readonly catalog: CatalogRepositoryPort) {}

  async execute(): Promise<CatalogOptions> {
    const [fields, grades, subjects, allSubjects] = await Promise.all([
      this.catalog.listFields(),
      this.catalog.listGrades(),
      this.catalog.listSubjects(),
      this.catalog.listSubjectLabels(),
    ]);

    return {
      fields,
      grades,
      subjects,
      subjectLabels: subjectLabelMap(allSubjects),
    };
  }
}
