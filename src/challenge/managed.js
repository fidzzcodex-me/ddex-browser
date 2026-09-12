const { sleep, randomBetween } = require('../human/timing');
const { CLOUDFLARE_CHALLENGE_TEXTS, DEFAULT_CHALLENGE_TIMEOUT } = require('../constants');
const { solveTurnstile } = require('./turnstile');
const { waitForInterstitial } = require('./interstitial');
const { waitForJSChallenge } = require('./js-detections');
const logger = require('../utils/logger');

async function solveManagedChallenge(page, options = {}) {
  const { timeout = DEFAULT_CHALLENGE_TIMEOUT, maxAttempts = 5 } = options;
  const start = Date.now();

  logger.info('Solving managed challenge (adaptive)');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (Date.now() - start >= timeout) break;

    logger.debug(`Managed challenge attempt ${attempt}/${maxAttempts}`);

    const content = await page.content().catch(() => '');
    const title = await page.title().catch(() => '');
    const url = page.url();

    const isTurnstile = await page.evaluate(() => {
      return !!(
        document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
        document.querySelector('[class*="cf-turnstile"]') ||
        document.querySelector('[data-sitekey]')
      );
    }).catch(() => false);

    if (isTurnstile) {
      logger.info('Managed → Turnstile path');
      await solveTurnstile(page, { timeout: Math.min(30000, timeout - (Date.now() - start)) });
      await sleep(2000);
      continue;
    }

    const hasInteractiveCheckbox = await page.evaluate(() => {
      return !!(
        document.querySelector('#challenge-form input[type="checkbox"]') ||
        document.querySelector('.ctp-checkbox-label') ||
        document.querySelector('[id*="cf-challenge"] input')
      );
    }).catch(() => false);

    if (hasInteractiveCheckbox) {
      logger.info('Managed → Interactive checkbox path');
      await waitForInterstitial(page, { timeout: Math.min(30000, timeout - (Date.now() - start)) });
      await sleep(2000);
      continue;
    }

    const isJSD = CLOUDFLARE_CHALLENGE_TEXTS.some(t =>
      content.includes(t) || title.includes(t)
    );

    if (isJSD) {
      logger.info('Managed → JS detection path');
      await waitForJSChallenge(page, {
        timeout: Math.min(20000, timeout - (Date.now() - start)),
        pollInterval: 1000,
      });
      await sleep(1500);
      continue;
    }

    const hasCFChlUrl = url.includes('cf-chl') || url.includes('/cdn-cgi/challenge');
    if (hasCFChlUrl) {
      logger.info('Managed → CDN-CGI challenge URL, waiting');
      await sleep(3000);
      continue;
    }

    logger.info('Managed challenge appears cleared');
    return true;
  }

  logger.warn('Managed challenge max attempts reached');
  return false;
}

module.exports = { solveManagedChallenge };
