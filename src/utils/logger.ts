/**
 * Structured Logger
 *
 * - Production / Staging: JSON lines (machine-readable, ready for log aggregators)
 * - Development:          Colourised, human-readable text
 * - Test:                 Silent (no output noise during jest runs)
 *
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('Query failed', { error: err.message, query: text });
 */

const isProd  = process.env.NODE_ENV === 'production';
const isStage = process.env.NODE_ENV === 'staging';
const isTest  = process.env.NODE_ENV === 'test';

// ── ANSI colour helpers (dev only) ──────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  grey:   '\x1b[90m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  magenta:'\x1b[35m',
};

type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVEL_COLOUR: Record<Level, string> = {
  debug: c.grey,
  info:  c.cyan,
  warn:  c.yellow,
  error: c.red,
  fatal: c.magenta,
};

// ── Formatters ───────────────────────────────────────────────────────────────

function jsonLog(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    time:  new Date().toISOString(),
    level,
    msg:   message,
    pid:   process.pid,
    env:   process.env.NODE_ENV,
    ...meta,
  };

  // Serialise Error objects so they survive JSON.stringify
  if (entry.error instanceof Error) {
    entry.error = { message: (entry.error as Error).message, stack: (entry.error as Error).stack };
  }

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'fatal') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

function prettyLog(level: Level, message: string, meta?: Record<string, unknown>) {
  const colour = LEVEL_COLOUR[level];
  const ts      = new Date().toLocaleTimeString();
  const prefix  = `${c.grey}${ts}${c.reset} ${colour}${level.toUpperCase().padEnd(5)}${c.reset}`;
  const suffix  = meta && Object.keys(meta).length
    ? `  ${c.grey}${JSON.stringify(meta)}${c.reset}`
    : '';

  const line = `${prefix} ${message}${suffix}`;
  if (level === 'error' || level === 'fatal') {
    console.error(line);
  } else {
    console.log(line);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

type LogFn = (message: string, meta?: Record<string, unknown>) => void;

function makeLogFn(level: Level): LogFn {
  if (isTest) return () => {};          // silence during tests
  if (isProd || isStage) return (msg, meta) => jsonLog(level, msg, meta);
  return (msg, meta) => prettyLog(level, msg, meta);
}

const logger = {
  debug: makeLogFn('debug'),
  info:  makeLogFn('info'),
  warn:  makeLogFn('warn'),
  error: makeLogFn('error'),
  fatal: makeLogFn('fatal'),

  /**
   * Attach per-request context (e.g. requestId, schoolId).
   * Returns a child logger that merges context into every log line.
   */
  child(context: Record<string, unknown>) {
    return {
      debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { ...context, ...meta }),
      info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { ...context, ...meta }),
      warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { ...context, ...meta }),
      error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { ...context, ...meta }),
      fatal: (msg: string, meta?: Record<string, unknown>) => logger.fatal(msg, { ...context, ...meta }),
    };
  },
};

export default logger;
export type { LogFn };
