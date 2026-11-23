/**
 * Pure Pomodoro state machine. No imports.
 *
 * Display derives from `endsAt` (`ceil((endsAt - now) / 1000)`, never
 * negative). `tick` after expiry finalizes (`focus → review` preserving
 * `focusStartedAt`, `break → idle`). `pause` freezes remaining; `resume`
 * re-derives `endsAt`. `completedFocusCount` increments on each expired
 * focus.
 */

export const POMODORO_FOCUS_SECONDS = 1500;
export const POMODORO_BREAK_SECONDS = 300;

export type TimerPhase = "idle" | "focus" | "break" | "review";

export interface TimerState {
  phase: TimerPhase;
  endsAt: number | null;
  remainingSeconds: number;
  pausedRemainingSeconds: number | null;
  focusStartedAt: Date | null;
  completedFocusCount: number;
}

export type TimerEvent =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "tick"; now: number }
  | { type: "startBreak"; now: number }
  | { type: "reset" };

export function initialTimerState(): TimerState {
  return {
    phase: "idle",
    endsAt: null,
    remainingSeconds: POMODORO_FOCUS_SECONDS,
    pausedRemainingSeconds: null,
    focusStartedAt: null,
    completedFocusCount: 0,
  };
}

function secondsRemaining(state: TimerState, now: number): number {
  if (state.phase === "idle") return state.remainingSeconds;
  if (state.phase === "review") return 0;
  if (state.endsAt !== null) {
    return Math.max(0, Math.ceil((state.endsAt - now) / 1000));
  }
  return state.pausedRemainingSeconds ?? state.remainingSeconds;
}

export function timerReducer(state: TimerState, event: TimerEvent): TimerState {
  switch (event.type) {
    case "start":
      if (state.phase === "idle") {
        return {
          ...state,
          phase: "focus",
          endsAt: event.now + state.remainingSeconds * 1000,
          pausedRemainingSeconds: null,
          focusStartedAt: new Date(event.now),
        };
      }
      return state;

    case "pause":
      if (state.phase === "focus" || state.phase === "break") {
        return {
          ...state,
          endsAt: null,
          pausedRemainingSeconds: secondsRemaining(state, event.now),
        };
      }
      return state;

    case "resume":
      if (
        (state.phase === "focus" || state.phase === "break") &&
        state.pausedRemainingSeconds !== null
      ) {
        return {
          ...state,
          endsAt: event.now + state.pausedRemainingSeconds * 1000,
          pausedRemainingSeconds: null,
        };
      }
      return state;

    case "tick": {
      const remaining = secondsRemaining(state, event.now);
      if (state.phase === "focus" && remaining <= 0) {
        return {
          ...state,
          phase: "review",
          endsAt: null,
          remainingSeconds: 0,
          pausedRemainingSeconds: null,
          completedFocusCount: state.completedFocusCount + 1,
        };
      }
      if (state.phase === "break" && remaining <= 0) {
        return {
          ...state,
          phase: "idle",
          endsAt: null,
          remainingSeconds: POMODORO_BREAK_SECONDS,
          pausedRemainingSeconds: null,
        };
      }
      return { ...state, remainingSeconds: remaining };
    }

    case "startBreak":
      if (state.phase === "review") {
        return {
          ...state,
          phase: "break",
          endsAt: event.now + POMODORO_BREAK_SECONDS * 1000,
          remainingSeconds: POMODORO_BREAK_SECONDS,
          pausedRemainingSeconds: null,
        };
      }
      return state;

    case "reset":
      return initialTimerState();
  }
}

export function remainingAt(state: TimerState, now: number): number {
  return secondsRemaining(state, now);
}
