import type { ReactNode } from "react";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { subjectLabel } from "@/modules/advising/domain/subjects";

import { TEST_IDS } from "@/constants/test-ids";
import type { Chapter } from "@/modules/advising/domain/models";
import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import { SubjectProgressView } from "./_components/subject-progress.view";
import { SchoolProgramAccordionView } from "./_components/school-program-accordion.view";
import { StudyPlanHeaderForm } from "./_components/study-plan-header-form.vm";
import { StudyPlanEntryForm } from "./_components/study-plan-entry-form.vm";
import { StudyPlanTable } from "./_components/study-plan-table.vm";

interface CounselorStudentViewProps {
  studentId: string;
  view: StudentStudyPlanView;
  chapters: Chapter[];
}

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

function dayLabel(dayOfWeek: number): string {
  const day = DAYS_OF_WEEK.find((d) => d.day === dayOfWeek);
  return day ? day.label : String(dayOfWeek);
}

export function CounselorStudentView(props: CounselorStudentViewProps): ReactNode {
  const { studentId, view, chapters } = props;

  return (
    <div className="flex flex-col gap-6" data-testid={TEST_IDS.COUNSELOR_PLAN.PAGE}>
      <section
        className="rounded-xl border border-slate-200 bg-white p-6"
        data-testid={TEST_IDS.COUNSELOR_PLAN.HEADER}
      >
        <h1 className="text-2xl font-bold">{studentId}</h1>
        <p className="text-sm text-slate-500" dir="ltr">
          دانش‌آموز · برنامه مشاور
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">برنامهٔ مدرسه</h2>
        <SchoolProgramAccordionView
          entries={view.schoolProgram.map((entry) => ({
            id: entry.id,
            dayOfWeek: entry.dayOfWeek,
            subjectLabel: entry.subject,
            minutes: entry.minutes,
          }))}
        />
      </section>

      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.COUNSELOR_VIEW.WEEKLY_SCHEDULE}
      >
        <h2 className="mb-3 text-lg font-semibold">برنامه هفتگی دانش‌آموز</h2>
        {view.weeklySchedule.length === 0 ? (
          <p className="text-sm text-slate-500">
            دانش‌آموز برنامه زمانی هفتگی ثبت نکرده است.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {view.weeklySchedule.map((slot) => (
              <li
                key={slot.id}
                className="flex justify-between px-3 py-2 border border-slate-100 rounded"
              >
                <span>{dayLabel(slot.dayOfWeek)}</span>
                <span className="flex items-center gap-2">
                  <span className="dir-ltr font-medium">
                    {persianDigits.format(Math.floor(slot.startMinute / 60))}:
                    {persianDigits
                      .format(slot.startMinute % 60)
                      .toString()
                      .padStart(2, "۰")}
                    –
                    {persianDigits.format(Math.floor(slot.endMinute / 60))}:
                    {persianDigits
                      .format(slot.endMinute % 60)
                      .toString()
                      .padStart(2, "۰")}
                  </span>
                  <span>{subjectLabel(slot.subject)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SubjectProgressView
        entries={view.rows.map((row) => ({
          subject: row.subject,
          subjectLabel: row.subject,
          plannedMinutes: row.plannedMinutes,
          studiedMinutes: row.studiedMinutes,
          testsDone: row.testsDone,
        }))}
        testsTarget={view.totals.testsTarget}
      />

      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_EDITOR}
      >
        <h2 className="mb-3 text-lg font-semibold">برنامهٔ هفتگی مشاور</h2>

        <div className="mb-6">
          <StudyPlanHeaderForm
            studentId={studentId}
            testsTarget={view.totals.testsTarget}
          />
        </div>

        <div className="mb-6">
          <StudyPlanEntryForm studentId={studentId} chapters={chapters} />
        </div>

        <StudyPlanTable
          studentId={studentId}
          entries={view.entries}
          chapters={chapters}
        />
      </section>
    </div>
  );
}
