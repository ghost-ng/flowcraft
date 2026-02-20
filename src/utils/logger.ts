// ---------------------------------------------------------------------------
// Chart Hero Logger
// ---------------------------------------------------------------------------
// Errors are ALWAYS logged. All other levels only log when debug mode is on.
// Debug mode is toggled via settingsStore and persisted to localStorage.
//
// Uses a module-level flag so stores can call setDebugMode() without creating
// circular imports.
// ---------------------------------------------------------------------------

let _debug = false;

/** Called by settingsStore on toggle and on rehydrate. */
export const setDebugMode = (on: boolean) => {
  _debug = on;
};

export const isDebugMode = () => _debug;

export const log = {
  /** Always logged regardless of debug mode. */
  error: (msg: string, ...args: unknown[]) => console.error(`[FC] ${msg}`, ...args),
  /** Only logged when debug mode is on. */
  warn: (msg: string, ...args: unknown[]) => { if (_debug) console.warn(`[FC] ${msg}`, ...args); },
  /** Only logged when debug mode is on. */
  info: (msg: string, ...args: unknown[]) => { if (_debug) console.info(`[FC] ${msg}`, ...args); },
  /** Only logged when debug mode is on. */
  debug: (msg: string, ...args: unknown[]) => { if (_debug) console.log(`[FC] ${msg}`, ...args); },
};
