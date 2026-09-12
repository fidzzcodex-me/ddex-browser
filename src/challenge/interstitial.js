const { sleep, randomBetween } = require('../human/timing');
const { CLOUDFLARE_CHALLENGE_TEXTS, DEFAULT_CHALLENGE_TIMEOUT } = require('../constants');
const logger = require('../utils/logger');

async function waitForInterstitial(page, options = {}) {
  const { timeout = DEFAULT_CHALLENGE_TIMEOUT } = options;
  const start = Date.now();

  logger.info('Waiting for interstitial challenge to clear');

  while (Date.now() - start < timeout) {
    const content = await page.content().catch(() => '');
    const title = await page.title().catch(() => '');

    const stillChallenge = CLOUDFLARE_CHALLENGE_TEXTS.some(t =>
      content.includes(t) || title.includes(t)
    );

    if (!stillChallenge) {
      logger.info('Interstitial challenge cleared');
      return true;
    }

    const isInteractive = await page.evaluate(() => {
      return !!document.querySelector('#challenge-form') &&
             !!document.querySelector('input[type="checkbox"]');
    }).catch(() => false);

    if (isInteractive) {
      logger.info('Interactive interstitial detected — attempting click');
      try {
        const cb = await page.$('#challenge-form input[type="checkbox"]');
        if (cb) {
          const box = await cb.boundingBox();
          if (box) {
            await page.mouse.move(
              box.x + box.width / 2 + randomBetween(-2, 2),
              box.y + box.height / 2 + randomBetween(-2, 2)
            );
            await sleep(randomBetween(150, 400));
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          }
        }
      } catch (err) {
        logger.debug('Interactive click error:', err.message);
      }
    }

    await sleep(1500);
  }

  throw new Error(`Interstitial challenge did not clear within ${timeout}ms`);
}

module.exports = { waitForInterstitial };
