const { sleep } = require('../human/timing');
const { DEFAULT_CHALLENGE_TIMEOUT } = require('../constants');
const logger = require('../utils/logger');

async function waitForJSChallenge(page, options = {}) {
  const { timeout = DEFAULT_CHALLENGE_TIMEOUT, pollInterval = 1000 } = options;
  const start = Date.now();

  logger.info('Waiting for JS challenge to complete');

  while (Date.now() - start < timeout) {
    const done = await page.evaluate(() => {
      return (
        !document.querySelector('[id*="challenge"]') &&
        !document.querySelector('[class*="challenge"]') &&
        !document.title.toLowerCase().includes('just a moment') &&
        !document.title.toLowerCase().includes('checking your browser')
      );
    }).catch(() => false);

    if (done) {
      logger.info('JS challenge completed');
      return true;
    }

    await sleep(pollInterval);
  }

  throw new Error(`JS challenge did not complete within ${timeout}ms`);
}

module.exports = { waitForJSChallenge };
