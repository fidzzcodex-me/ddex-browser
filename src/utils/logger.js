const { LOG_LEVELS } = require('../constants');

class Logger {
  constructor(level = LOG_LEVELS.SILENT) {
    this.level = level;
  }

  setLevel(level) {
    this.level = typeof level === 'number' ? level : 0;
  }

  _ts() {
    return new Date().toISOString();
  }

  error(...args) {
    if (this.level >= LOG_LEVELS.ERROR) console.error(`[ccid][${this._ts()}][ERR]`, ...args);
  }

  warn(...args) {
    if (this.level >= LOG_LEVELS.WARN) console.warn(`[ccid][${this._ts()}][WRN]`, ...args);
  }

  info(...args) {
    if (this.level >= LOG_LEVELS.INFO) console.log(`[ccid][${this._ts()}][INF]`, ...args);
  }

  debug(...args) {
    if (this.level >= LOG_LEVELS.DEBUG) console.log(`[ccid][${this._ts()}][DBG]`, ...args);
  }

  trace(...args) {
    if (this.level >= LOG_LEVELS.TRACE) console.log(`[ccid][${this._ts()}][TRC]`, ...args);
  }
}

module.exports = new Logger();
