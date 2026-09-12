const { sleep, randomBetween, gaussianRandom, clamp } = require('./timing');

async function idleMicroMovement(page, durationMs, currentPos = { x: 400, y: 300 }) {
  const deadline = Date.now() + durationMs;
  let pos = { ...currentPos };

  while (Date.now() < deadline) {
    const roll = Math.random();

    if (roll < 0.20) {
      const dx = gaussianRandom(0, 7);
      const dy = gaussianRandom(0, 7);
      pos.x = clamp(Math.round(pos.x + dx), 10, 1260);
      pos.y = clamp(Math.round(pos.y + dy), 10, 780);
      await page.mouse.move(pos.x, pos.y);
      await sleep(clamp(Math.round(gaussianRandom(90, 30)), 40, 200));
    } else if (roll < 0.28) {
      await page.mouse.move(
        clamp(Math.round(pos.x + gaussianRandom(0, 2)), 10, 1260),
        clamp(Math.round(pos.y + gaussianRandom(0, 2)), 10, 780)
      );
      await sleep(randomBetween(20, 60));
    } else {
      await sleep(clamp(Math.round(gaussianRandom(320, 110)), 100, 700));
    }
  }

  return pos;
}

async function randomTabSwitch(page) {
  if (Math.random() > 0.12) return;
  await page.keyboard.down('Alt');
  await sleep(randomBetween(80, 180));
  await page.keyboard.press('Tab');
  await sleep(randomBetween(400, 1200));
  await page.keyboard.press('Tab');
  await page.keyboard.up('Alt');
  await sleep(randomBetween(200, 500));
}

module.exports = { idleMicroMovement, randomTabSwitch };
