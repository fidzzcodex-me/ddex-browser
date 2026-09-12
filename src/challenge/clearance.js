const { sleep } = require('../human/timing');
const { CLOUDFLARE_CLEARANCE_COOKIE, DEFAULT_CHALLENGE_TIMEOUT } = require('../constants');
const { detectChallengeType } = require('./detector');
const { solveTurnstile } = require('./turnstile');
const { waitForInterstitial } = require('./interstitial');
const { waitForJSChallenge } = require('./js-detections');
const { solveManagedChallenge } = require('./managed');
const { CHALLENGE_TYPES } = require('../constants');
const logger = require('../utils/logger');

async function waitForClearanceCookie(page, options = {}) {
  const {
    timeout = DEFAULT_CHALLENGE_TIMEOUT,
    pollInterval = 1500,
    onChallenge = null,
  } = options;

  const start = Date.now();
  let lastType = null;

  logger.info('Waiting for cf_clearance cookie');

  while (Date.now() - start < timeout) {
    const cookies = await page.cookies().catch(() => []);
    const clearance = cookies.find(c => c.name === CLOUDFLARE_CLEARANCE_COOKIE);

    if (clearance) {
      logger.info('cf_clearance obtained:', clearance.value.substring(0, 20) + '...');
      return clearance;
    }

    const challengeType = await detectChallengeType(page);

    if (challengeType !== CHALLENGE_TYPES.NONE && challengeType !== lastType) {
      lastType = challengeType;
      logger.info('Challenge detected:', challengeType);
      if (onChallenge) {
        try { onChallenge(challengeType); } catch {}
      }
    }

    const remaining = timeout - (Date.now() - start);

    if (challengeType === CHALLENGE_TYPES.TURNSTILE) {
      await solveTurnstile(page, { timeout: Math.min(25000, remaining), maxAttempts: 2 })
        .catch(e => logger.debug('Turnstile attempt error:', e.message));
    } else if (challengeType === CHALLENGE_TYPES.INTERSTITIAL) {
      await waitForInterstitial(page, { timeout: Math.min(20000, remaining) })
        .catch(e => logger.debug('Interstitial attempt error:', e.message));
    } else if (challengeType === CHALLENGE_TYPES.JS_DETECTION) {
      await waitForJSChallenge(page, { timeout: Math.min(15000, remaining) })
        .catch(e => logger.debug('JSD attempt error:', e.message));
    }

    await sleep(pollInterval);
  }

  throw new Error(`cf_clearance not obtained within ${timeout}ms`);
}

module.exports = { waitForClearanceCookie };
