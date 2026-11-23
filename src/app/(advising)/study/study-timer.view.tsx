import type { ReactNode } from "react";
import { Button } from "antd";
import type { TimerState, TimerEvent } from "@/modules/advising/presentation/pomodoro-timer";
import { remainingAt } from "@/modules/advising/presentation/pomodoro-timer";
import type { StudyAnalysis } from "@/modules/advising/application/study";

import { StudySessionForm } from "./_components/study-session-form.vm";
import { StudyAnalysisView } from "./_components/study-analysis.view";
import { TEST_IDS } from "@/constants/test-ids";

interface StudyTimerViewProps {
  state: TimerState;
  dispatch: React.Dispatch<TimerEvent>;
  analysis: StudyAnalysis;
  canWrite: boolean;
  fieldOfStudy: string | null;
}

export function StudyTimerView(props: StudyTimerViewProps): ReactNode {
  const { state, dispatch, analysis, canWrite, fieldOfStudy: _fieldOfStudy } = props;

  const isFocus = state.phase === "focus";
  const remaining = isFocus ? remainingAt(state, Date.now()) : 0;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const timerDisplay = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">تایمر مطالعه</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        {isFocus ? (
          <div className="text-4xl font-mono dir-ltr">{timerDisplay}</div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {state.phase === "idle" && canWrite && (
            <Button
              onClick={() => dispatch({ type: "start", now: Date.now() })}
              data-testid={TEST_IDS.STUDY.TIMER_START}
            >
              شروع
            </Button>
          )}
          {(state.phase === "focus" || state.phase === "break") && canWrite && (
            <Button
              onClick={() => dispatch({ type: "pause", now: Date.now() })}
              data-testid={TEST_IDS.STUDY.TIMER_PAUSE}
            >
              توقف
            </Button>
          )}
          {state.phase === "break" && canWrite && (
            <Button
              onClick={() => dispatch({ type: "resume", now: Date.now() })}
              data-testid={TEST_IDS.STUDY.TIMER_RESUME}
            >
              ادامه
            </Button>
          )}
          {canWrite && (
            <Button
              onClick={() => dispatch({ type: "reset" })}
              data-testid={TEST_IDS.STUDY.TIMER_RESET}
            >
              ریست
            </Button>
          )}
        </div>

        {state.phase === "review" && canWrite && state.focusStartedAt !== null && (
          <StudySessionForm
            initialValues={{
              category: "study",
              durationMinutes: 25,
              startedAt: state.focusStartedAt.toISOString(),
            }}
          />
        )}
      </div>

      <StudyAnalysisView analysis={analysis} />
    </div>
  );
}
