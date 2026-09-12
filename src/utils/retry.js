const { sleep } = require('../human/timing');
const logger = require('./logger');

async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    backoff = 1.5,
    label = 'operation',
    onRetry = null,
  } = options;

  let lastErr;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      logger.debug(`${label} attempt ${attempt}/${retries} failed: ${err.message}`);

      if (onRetry) {
        try { await onRetry(err, attempt); } catch {}
      }

      if (attempt < retries) {
        await sleep(currentDelay);
        currentDelay = Math.round(currentDelay * backoff);
      }
    }
  }

  throw lastErr;
}

async function withTimeout(fn, ms, label = 'operation') {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

module.exports = { withRetry, withTimeout };
