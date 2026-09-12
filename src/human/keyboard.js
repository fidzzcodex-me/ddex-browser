const { sleep, typeDelay, gaussianRandom, randomBetween, clamp } = require('./timing');

const QWERTY_NEIGHBORS = {
  a:'sqwz', b:'vng', c:'xvdf', d:'sercf', e:'wrsdf', f:'drtgvc',
  g:'ftyhbv', h:'gyujnb', i:'ujko', j:'huikmn', k:'jiolm', l:'kop',
  m:'njk', n:'bhjm', o:'iklp', p:'ol', q:'wa', r:'edft', s:'awedxz',
  t:'rfgy', u:'yhji', v:'cfgb', w:'qase', x:'zsdc', y:'tghu', z:'asx',
};

const BIGRAM_PAUSE = {
  th: -15, he: -12, in: -10, er: -8, an: -8, re: -8, on: -6,
  nt: 10, tr: 12, ng: 8, gh: 10, qu: 15, wh: 12,
};

function nearbyChar(char) {
  const lower = char.toLowerCase();
  const pool = QWERTY_NEIGHBORS[lower];
  if (!pool) return char;
  return pool[Math.floor(Math.random() * pool.length)];
}

function bigramAdjustment(prev, cur) {
  const key = (prev + cur).toLowerCase();
  return BIGRAM_PAUSE[key] || 0;
}

async function typeText(page, selector, text, options = {}) {
  const {
    typos = true,
    typoRate = 0.028,
    clearFirst = false,
    humanPause = true,
  } = options;

  await page.focus(selector);
  await sleep(clamp(Math.round(gaussianRandom(150, 50)), 80, 400));

  if (clearFirst) {
    await page.keyboard.down('Control');
    await sleep(randomBetween(30, 80));
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await sleep(randomBetween(50, 130));
    await page.keyboard.press('Backspace');
    await sleep(randomBetween(60, 180));
  }

  let prevChar = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    let baseDelay = typeDelay(char);

    if (prevChar) {
      baseDelay += bigramAdjustment(prevChar, char);
    }

    const finalDelay = clamp(Math.round(baseDelay + gaussianRandom(0, 8)), 18, 700);

    const doTypo = typos
      && char.trim().length === 1
      && Math.random() < typoRate
      && i < text.length - 1;

    if (doTypo) {
      const wrong = nearbyChar(char);
      await page.keyboard.type(wrong);
      const pauseBeforeCorrect = clamp(Math.round(gaussianRandom(280, 80)), 160, 700);
      await sleep(pauseBeforeCorrect);
      await page.keyboard.press('Backspace');
      await sleep(clamp(Math.round(gaussianRandom(120, 35)), 60, 300));
    }

    await page.keyboard.type(char);
    await sleep(finalDelay);

    if (humanPause && (char === '.' || char === '!' || char === '?') && i < text.length - 1) {
      await sleep(clamp(Math.round(gaussianRandom(400, 120)), 200, 900));
    }

    prevChar = char;
  }
}

async function pressKey(page, key, options = {}) {
  const { delay = null } = options;
  const waitMs = delay !== null ? delay : clamp(Math.round(gaussianRandom(90, 28)), 35, 250);
  await sleep(waitMs);
  await page.keyboard.down(key);
  await sleep(clamp(Math.round(gaussianRandom(65, 18)), 30, 150));
  await page.keyboard.up(key);
  await sleep(clamp(Math.round(gaussianRandom(55, 15)), 20, 120));
}

module.exports = { typeText, pressKey };
