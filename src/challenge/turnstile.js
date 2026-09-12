const { sleep, randomBetween } = require('../human/timing');
const { DEFAULT_CHALLENGE_TIMEOUT } = require('../constants');
const logger = require('../utils/logger');

async function _clickCoordinate(page, x, y) {
  await page.mouse.move(
    x + randomBetween(-4, 4),
    y + randomBetween(-4, 4)
  );
  await sleep(randomBetween(80, 220));
  await page.mouse.click(x, y);
}

async function _tryClickByResponseInput(page) {
  const elements = await page.$$('[name="cf-turnstile-response"]').catch(() => []);
  if (elements.length === 0) return false;

  for (const el of elements) {
    try {
      const parent = await el.evaluateHandle(e => e.parentElement);
      const box = await parent.boundingBox();
      if (!box) continue;
      await _clickCoordinate(page, box.x + 30, box.y + box.height / 2);
      logger.debug('Turnstile: clicked via cf-turnstile-response parent');
    } catch {}
  }
  return true;
}

async function _tryClickByGeometry(page) {
  const coords = await page.evaluate(() => {
    const results = [];
    const tryDivs = (strict) => {
      document.querySelectorAll('div').forEach(el => {
        try {
          const rect = el.getBoundingClientRect();
          const css = window.getComputedStyle(el);
          const isEmpty = !el.querySelector('*');
          const inRange = rect.width > 290 && rect.width <= 310;
          if (!inRange || !isEmpty) return;
          if (strict && (css.margin !== '0px' || css.padding !== '0px')) return;
          results.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
        } catch {}
      });
    };
    tryDivs(true);
    if (results.length === 0) tryDivs(false);
    return results;
  }).catch(() => []);

  if (coords.length === 0) return false;

  for (const c of coords) {
    try {
      await _clickCoordinate(page, c.x + 30, c.y + c.h / 2);
      logger.debug('Turnstile: clicked via geometry probe');
    } catch {}
  }
  return true;
}

async function _tryClickIframe(page) {
  const iframeEl = await page.$('iframe[src*="challenges.cloudflare.com"]').catch(() => null);
  if (!iframeEl) return false;

  const frame = await iframeEl.contentFrame().catch(() => null);
  if (!frame) return false;

  await sleep(randomBetween(600, 1400));

  const checkbox = await frame.$('input[type="checkbox"]').catch(() => null)
    || await frame.$('label').catch(() => null);

  if (checkbox) {
    const box = await checkbox.boundingBox().catch(() => null);
    if (box) {
      await _clickCoordinate(page, box.x + box.width / 2, box.y + box.height / 2);
      logger.debug('Turnstile: clicked iframe checkbox/label');
      return true;
    }
  }

  const box = await iframeEl.boundingBox().catch(() => null);
  if (box) {
    await _clickCoordinate(page, box.x + 30, box.y + box.height / 2);
    logger.debug('Turnstile: clicked iframe fallback position');
    return true;
  }

  return false;
}

async function solveTurnstile(page, options = {}) {
  const { timeout = DEFAULT_CHALLENGE_TIMEOUT, maxAttempts = 3 } = options;
  const deadline = Date.now() + timeout;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`Turnstile solve attempt ${attempt}/${maxAttempts}`);

    if (Date.now() >= deadline) break;

    try {
      await sleep(randomBetween(500, 1200));

      const hit = await _tryClickByResponseInput(page)
        || await _tryClickIframe(page)
        || await _tryClickByGeometry(page);

      if (hit) {
        await sleep(randomBetween(1800, 3500));
        const cleared = await page.evaluate(() => {
          const el = document.querySelector('[name="cf-turnstile-response"]');
          return el && el.value && el.value.length > 0;
        }).catch(() => false);

        if (cleared) {
          logger.info('Turnstile: response token confirmed');
          return true;
        }
      }

      await sleep(2000);
    } catch (err) {
      logger.debug(`Turnstile attempt ${attempt} error:`, err.message);
      await sleep(1500);
    }
  }

  logger.warn('Turnstile: max attempts reached without confirmed token');
  return false;
}

module.exports = { solveTurnstile };
