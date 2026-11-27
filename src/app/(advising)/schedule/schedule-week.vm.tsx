"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import type { Chapter, SchoolProgramEntry as SchoolProgramRow, StudyPlanEntry, SubjectRow } from "@/modules/advising/domain/models";
import { shiftDayKey } from "@/modules/advising/domain/day-key";
import type { SchoolProgramEntry } from "./_components/school-program-form.view";
import { ScheduleWeekView, type ScheduleRow } from "./schedule-week.view";
import { setStudyMinutesAction, setSubjectTestsAction } from "./study-log.actions";

interface ScheduleWeekVMProps {
  program: StudentStudyPlanView;
  chapters: Chapter[];
  currentWeekKey: string;
  schoolProgram: SchoolProgramRow[];
  canWriteProgram: boolean;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

export function ScheduleWeekWrapper(props: ScheduleWeekVMProps) {
  const { program, schoolProgram, ...rest } = props;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const rows: ScheduleRow[] = program.entries
    .map((entry: StudyPlanEntry) => ({
      ...entry,
      dayKey: shiftDayKey(program.weekKey, entry.dayOfWeek),
      loggedMinutes: program.loggedMinutesByEntry[entry.id] ?? 0,
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const saveMinutes = useCallback(
    async (row: ScheduleRow, minutes: number) => {
      setError(null);
      const result = await setStudyMinutesAction({
        weekKey: program.weekKey,
        dayKey: row.dayKey,
        entryId: row.id,
        minutes,
      });
      if (result.ok) router.refresh();
      else setError(result.error.message);
    },
    [program.weekKey, router],
  );

  const saveTests = useCallback(
    async (subject: string, count: number) => {
      setError(null);
      const result = await setSubjectTestsAction({
        weekKey: program.weekKey,
        subject,
        count,
      });
      if (result.ok) router.refresh();
      else setError(result.error.message);
    },
    [program.weekKey, router],
  );

  const goToWeek = useCallback(
    (weekKey: string) =>
      router.push(
        weekKey === props.currentWeekKey ? "/schedule" : `/schedule?week=${weekKey}`,
      ),
    [props.currentWeekKey, router],
  );

  const schoolProgramEntries: SchoolProgramEntry[] = schoolProgram.map(
    (entry) => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      subject: entry.subject,
      hours: entry.minutes / 60,
    }),
  );

  return (
    <ScheduleWeekView
      {...rest}
      rows={rows}
      weekKey={program.weekKey}
      plannedMinutes={program.totals.plannedMinutes}
      testsTarget={program.totals.testsTarget}
      studiedMinutes={program.goalProgress.studyMinutes}
      testsDone={program.goalProgress.testsDone}
      testsBySubject={program.testsBySubject}
      schoolProgramEntries={schoolProgramEntries}
      error={error}
      onSaveMinutes={saveMinutes}
      onSaveTests={saveTests}
      onGoToWeek={goToWeek}
    />
  );
}
