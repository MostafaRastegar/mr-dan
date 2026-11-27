import type { ReactNode } from "react";
import { Tag } from "antd";

import type { SubjectRow } from "@/modules/advising/domain/models";
import { labelOf, subjectOptions } from "@/modules/advising/domain/catalog";

import { TEST_IDS } from "@/constants/test-ids";
import type { Chapter } from "@/modules/advising/domain/models";
import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import { SubjectProgressView } from "./_components/subject-progress.view";
import { SchoolProgramAccordionView } from "./_components/school-program-accordion.view";
import {
  SupervisionSectionsView,
  type SupervisionSections,
} from "./_components/supervision-sections.view";
import { StudyPlanHeaderForm } from "./_components/study-plan-header-form.vm";
import { StudyPlanEntryForm } from "./_components/study-plan-entry-form.vm";
import { StudyPlanTable } from "./_components/study-plan-table.vm";

interface CounselorStudentViewProps {
  studentId: string;
  view: StudentStudyPlanView;
  canWrite: boolean;
  supervision: SupervisionSections | null;
  chapters: Chapter[];
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

export function CounselorStudentView(props: CounselorStudentViewProps): ReactNode {
  const { studentId, view, canWrite, supervision, chapters, subjects, labels } =
    props;
  const options = subjectOptions(subjects, {
    field: view.student.fieldOfStudy,
    grade: view.student.grade,
  });

  return (
    <div className="flex flex-col gap-6" data-testid={TEST_IDS.COUNSELOR_PLAN.PAGE}>
      <section
        className="rounded-xl border border-slate-200 bg-white p-6"
        data-testid={TEST_IDS.COUNSELOR_PLAN.HEADER}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{view.student.fullName}</h1>
          {canWrite ? null : (
            <Tag color="gold" data-testid={TEST_IDS.SUPERVISION.READONLY}>
              نمایش نظارتی · فقط خواندنی
            </Tag>
          )}
        </div>
        <p className="text-sm text-slate-500" dir="ltr">
          دانش‌آموز · برنامهٔ مطالعه
        </p>
      </section>

      {supervision ? (
        <SupervisionSectionsView supervision={supervision} labels={labels} />
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">برنامهٔ مدرسه</h2>
        <SchoolProgramAccordionView
          entries={view.schoolProgram.map((entry) => ({
            id: entry.id,
            dayOfWeek: entry.dayOfWeek,
            subjectLabel: labelOf(labels, entry.subject),
            minutes: entry.minutes,
          }))}
        />
      </section>

      <SubjectProgressView
        entries={view.rows.map((row) => ({
          subject: row.subject,
          subjectLabel: labelOf(labels, row.subject),
          plannedMinutes: row.plannedMinutes,
          studiedMinutes: row.studiedMinutes,
          testsDone: row.testsDone,
          testsTarget: row.testsTarget,
        }))}
        testsTarget={view.totals.testsTarget}
        testsDone={view.totals.testsDone}
      />

      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_EDITOR}
      >
        <h2 className="mb-3 text-lg font-semibold">برنامهٔ مطالعهٔ دانش‌آموز</h2>

        {canWrite ? (
          <>
            <div className="mb-6">
              <StudyPlanHeaderForm
                studentId={studentId}
                testsTarget={view.totals.testsTarget}
              />
            </div>

            <div className="mb-6">
              <StudyPlanEntryForm
                studentId={studentId}
                chapters={chapters}
                subjectOptions={options}
                fieldOfStudy={view.student.fieldOfStudy}
              />
            </div>
          </>
        ) : null}

        <StudyPlanTable
          studentId={studentId}
          entries={view.entries}
          chapters={chapters}
          labels={labels}
          canWrite={canWrite}
        />
      </section>
    </div>
  );
}
