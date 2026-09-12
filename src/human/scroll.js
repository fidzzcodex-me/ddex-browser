const { sleep, randomBetween, gaussianRandom, clamp, scrollStepDelay } = require('./timing');

const SCROLL_STEP_MIN = 60;
const SCROLL_STEP_MAX = 220;
const WHEEL_DELTA_MULTIPLIER = 3;

async function naturalScroll(page, targetAmount, options = {}) {
  const {
    direction = 'down',
    x = null,
    y = null,
  } = options;

  const sign = direction === 'down' ? 1 : -1;
  let scrolled = 0;
  const total = Math.abs(targetAmount);

  if (x !== null && y !== null) {
    await page.mouse.move(x, y);
  }

  while (scrolled < total) {
    const remaining = total - scrolled;
    const rawStep = clamp(Math.round(gaussianRandom(130, 45)), SCROLL_STEP_MIN, SCROLL_STEP_MAX);
    const step = Math.min(rawStep, remaining);
    const progress = scrolled / total;

    await page.mouse.wheel({ deltaY: step * sign * WHEEL_DELTA_MULTIPLIER });
    scrolled += step;

    const delay = scrollStepDelay(progress);
    await sleep(delay);

    if (Math.random() < 0.08) {
      await sleep(randomBetween(200, 600));
    }
  }
}

async function scrollAndRead(page, durationMs, options = {}) {
  const {
    readPauseMin = 900,
    readPauseMax = 2800,
    scrollChunkMin = 80,
    scrollChunkMax = 240,
    mouseDriftChance = 0.25,
  } = options;

  const deadline = Date.now() + durationMs;

  while (Date.now() < deadline) {
    const chunk = randomBetween(scrollChunkMin, scrollChunkMax);
    await naturalScroll(page, chunk, { direction: 'down' });

    const pauseMs = clamp(
      Math.round(gaussianRandom((readPauseMin + readPauseMax) / 2, 350)),
      readPauseMin,
      readPauseMax
    );
    await sleep(pauseMs);

    if (Math.random() < mouseDriftChance) {
      await page.mouse.move(
        Math.round(randomBetween(180, 900)),
        Math.round(randomBetween(150, 650))
      );
      await sleep(randomBetween(120, 400));
    }
  }
}

module.exports = { naturalScroll, scrollAndRead };
