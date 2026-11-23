"use client";

import { useReducer, useEffect, useRef } from "react";

import {
  timerReducer,
  initialTimerState,
} from "@/modules/advising/presentation/pomodoro-timer";
import type { StudyAnalysis } from "@/modules/advising/application/study";

import { StudyTimerView } from "./study-timer.view";

interface StudyTimerVMProps {
  analysis: StudyAnalysis;
  canWrite: boolean;
  fieldOfStudy: string | null;
}

export function StudyTimerWrapper({
  analysis,
  canWrite,
  fieldOfStudy,
}: StudyTimerVMProps) {
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    initialTimerState,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      dispatch({ type: "tick", now: Date.now() });
    }, 1000);

    const onVisible = () => dispatch({ type: "tick", now: Date.now() });
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <StudyTimerView
      state={state}
      dispatch={dispatch}
      analysis={analysis}
      canWrite={canWrite}
      fieldOfStudy={fieldOfStudy}
    />
  );
}
