/**
 * Logger estructurado: nivel según entorno (DEV=DEBUG, prod=ERROR).
 */

const isDev = import.meta.env.DEV;
const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

class Logger {
  constructor() {
    this.level = isDev ? levels.DEBUG : levels.ERROR;
  }

  debug(...args) {
    if (this.level <= levels.DEBUG) console.log('[DEBUG]', ...args);
  }

  info(...args) {
    if (this.level <= levels.INFO) console.log('[INFO]', ...args);
  }

  warn(...args) {
    if (this.level <= levels.WARN) console.warn('[WARN]', ...args);
  }

  error(...args) {
    if (this.level <= levels.ERROR) console.error('[ERROR]', ...args);
  }

  audit(action, data) {
    if (isDev) console.log('[AUDIT]', action, data);
  }
}

export const logger = new Logger();
