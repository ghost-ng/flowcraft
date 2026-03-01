import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Timer Store — tracks cumulative time spent on the current diagram
// ---------------------------------------------------------------------------

export interface TimerState {
  /** Accumulated elapsed seconds (persisted via autosave, NOT zustand-persist) */
  elapsedSeconds: number;

  /** Timestamp (ms) when the current session segment started (null = paused) */
  _sessionStart: number | null;

  /** Start or resume the timer from a given base (e.g. restored from autosave) */
  start: (baseSeconds?: number) => void;

  /** Return the current total elapsed seconds (base + live session delta) */
  getElapsed: () => number;

  /** Tick — update elapsedSeconds from the running session (called by interval) */
  tick: () => void;

  /** Set the elapsed time directly (used when restoring from autosave or import) */
  setElapsed: (seconds: number) => void;

  /** Reset timer to zero and restart */
  reset: () => void;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  elapsedSeconds: 0,
  _sessionStart: null,

  start: (baseSeconds?: number) => {
    set({
      elapsedSeconds: baseSeconds ?? get().elapsedSeconds,
      _sessionStart: Date.now(),
    });
  },

  getElapsed: () => {
    const { elapsedSeconds, _sessionStart } = get();
    if (!_sessionStart) return elapsedSeconds;
    return elapsedSeconds + Math.floor((Date.now() - _sessionStart) / 1000);
  },

  tick: () => {
    const { _sessionStart } = get();
    if (!_sessionStart) return;
    const sessionDelta = Math.floor((Date.now() - _sessionStart) / 1000);
    set({
      elapsedSeconds: get().elapsedSeconds + sessionDelta,
      _sessionStart: Date.now(),
    });
  },

  setElapsed: (seconds: number) => {
    set({
      elapsedSeconds: seconds,
      _sessionStart: Date.now(),
    });
  },

  reset: () => {
    set({
      elapsedSeconds: 0,
      _sessionStart: Date.now(),
    });
  },
}));
