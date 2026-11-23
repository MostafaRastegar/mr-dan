import { describe, expect, it } from "vitest";

import {
  initialTimerState,
  POMODORO_BREAK_SECONDS,
  POMODORO_FOCUS_SECONDS,
  remainingAt,
  timerReducer,
} from "./pomodoro-timer";

describe("pomodoro timer", () => {
  it("pomodoro", () => {
    const startNow = 1000;
    let state = initialTimerState();
    expect(state.phase).toBe("idle");
    expect(state.remainingSeconds).toBe(POMODORO_FOCUS_SECONDS);
    expect(state.focusStartedAt).toBeNull();

    // start focus
    state = timerReducer(state, { type: "start", now: startNow });
    expect(state.phase).toBe("focus");
    expect(state.focusStartedAt).toEqual(new Date(startNow));
    expect(state.endsAt).toBe(startNow + POMODORO_FOCUS_SECONDS * 1000);

    // tick 600s in
    state = timerReducer(state, { type: "tick", now: startNow + 600 * 1000 });
    expect(state.remainingSeconds).toBe(900);
    expect(state.phase).toBe("focus");

    // pause at 600s keeps 900s
    state = timerReducer(state, { type: "pause", now: startNow + 600 * 1000 });
    expect(state.phase).toBe("focus");
    expect(state.endsAt).toBeNull();
    expect(state.pausedRemainingSeconds).toBe(900);

    // resume continues
    state = timerReducer(state, { type: "resume", now: startNow + 600 * 1000 });
    expect(state.endsAt).toBe(startNow + 600 * 1000 + 900 * 1000);
    expect(state.pausedRemainingSeconds).toBeNull();

    // tick 1500s after start - focus expires → review with original focusStartedAt
    state = timerReducer(state, { type: "tick", now: startNow + 1500 * 1000 });
    expect(state.phase).toBe("review");
    expect(state.focusStartedAt).toEqual(new Date(startNow));
    expect(state.completedFocusCount).toBe(1);
    expect(state.remainingSeconds).toBe(0);

    // start break
    state = timerReducer(state, { type: "startBreak", now: startNow + 1500 * 1000 });
    expect(state.phase).toBe("break");
    expect(state.endsAt).toBe(startNow + 1500 * 1000 + POMODORO_BREAK_SECONDS * 1000);

    // break expires → idle
    state = timerReducer(state, {
      type: "tick",
      now: startNow + 1500 * 1000 + POMODORO_BREAK_SECONDS * 1000 + 1,
    });
    expect(state.phase).toBe("idle");

    // tab suspended past endsAt - no negative time
    state = initialTimerState();
    state = timerReducer(state, { type: "start", now: 1000 });
    state = timerReducer(state, { type: "tick", now: 1000 + 2000 * 1000 });
    expect(state.phase).toBe("review");
    expect(state.remainingSeconds).toBe(0);
    expect(remainingAt(state, 1000 + 3000 * 1000)).toBe(0);
  });
});
