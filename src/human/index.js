const { moveMouse, dispatchNaturalClick } = require('./mouse');
const { typeText, pressKey } = require('./keyboard');
const { naturalScroll, scrollAndRead } = require('./scroll');
const { idleMicroMovement, randomTabSwitch } = require('./idle');
const { sleep, randomBetween, gaussianRandom, clamp, reactionDelay } = require('./timing');
const logger = require('../utils/logger');

class HumanLayer {
  constructor(page) {
    this.page = page;
    this._pos = { x: randomBetween(300, 700), y: randomBetween(200, 500) };
  }

  async moveMouse(x, y) {
    this._pos = await moveMouse(this.page, x, y, this._pos);
  }

  async _center(selector, opts = {}) {
    await this.page.waitForSelector(selector, { timeout: opts.timeout || 12000 });
    const el = await this.page.$(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    const box = await el.boundingBox();
    if (!box) throw new Error(`No bounding box: ${selector}`);

    const px = clamp(
      Math.round(box.x + box.width * (0.35 + Math.random() * 0.3)),
      Math.round(box.x + 2),
      Math.round(box.x + box.width - 2)
    );
    const py = clamp(
      Math.round(box.y + box.height * (0.3 + Math.random() * 0.4)),
      Math.round(box.y + 2),
      Math.round(box.y + box.height - 2)
    );
    return { x: px, y: py, box, el };
  }

  async click(selector, opts = {}) {
    const { x, y } = await this._center(selector, opts);
    await this.moveMouse(x, y);
    await sleep(reactionDelay());
    await dispatchNaturalClick(this.page, x, y);
    logger.debug(`click: ${selector}`);
  }

  async doubleClick(selector, opts = {}) {
    const { x, y } = await this._center(selector, opts);
    await this.moveMouse(x, y);
    await sleep(reactionDelay());
    await this.page.mouse.click(x, y, {
      clickCount: 2,
      delay: clamp(Math.round(gaussianRandom(70, 18)), 40, 160),
    });
    logger.debug(`doubleClick: ${selector}`);
  }

  async rightClick(selector, opts = {}) {
    const { x, y } = await this._center(selector, opts);
    await this.moveMouse(x, y);
    await sleep(reactionDelay());
    await this.page.mouse.click(x, y, { button: 'right' });
    logger.debug(`rightClick: ${selector}`);
  }

  async hover(selector, opts = {}) {
    const { x, y } = await this._center(selector, opts);
    await this.moveMouse(x, y);
    await sleep(randomBetween(120, 500));
    logger.debug(`hover: ${selector}`);
  }

  async type(selector, text, opts = {}) {
    await this.click(selector, opts);
    await sleep(clamp(Math.round(gaussianRandom(180, 60)), 90, 500));
    await typeText(this.page, selector, text, opts);
    logger.debug(`type: ${selector} [${text.length} chars]`);
  }

  async select(selector, value, opts = {}) {
    await this.click(selector, opts);
    await sleep(randomBetween(120, 350));
    await this.page.select(selector, value);
    await sleep(randomBetween(80, 250));
    logger.debug(`select: ${selector} = ${value}`);
  }

  async dragAndDrop(fromSel, toSel, opts = {}) {
    const from = await this._center(fromSel, opts);
    const to = await this._center(toSel, opts);

    await this.moveMouse(from.x, from.y);
    await sleep(reactionDelay());
    await this.page.mouse.down();
    await sleep(clamp(Math.round(gaussianRandom(90, 25)), 50, 200));

    const steps = clamp(Math.round(Math.hypot(to.x - from.x, to.y - from.y) / 12), 10, 40);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const nx = Math.round(from.x + (to.x - from.x) * ease + gaussianRandom(0, 1.5));
      const ny = Math.round(from.y + (to.y - from.y) * ease + gaussianRandom(0, 1.5));
      await this.page.mouse.move(nx, ny);
      await sleep(randomBetween(8, 22));
    }

    await this.page.mouse.up();
    this._pos = { x: to.x, y: to.y };
    logger.debug(`dragAndDrop: ${fromSel} → ${toSel}`);
  }

  async scroll(amount, opts = {}) {
    await naturalScroll(this.page, amount, opts);
  }

  async scrollAndRead(durationMs, opts = {}) {
    await scrollAndRead(this.page, durationMs, opts);
  }

  async idle(durationMs = 2000) {
    this._pos = await idleMicroMovement(this.page, durationMs, this._pos);
  }

  async press(key, opts = {}) {
    await pressKey(this.page, key, opts);
  }

  async hotkey(...keys) {
    for (let i = 0; i < keys.length - 1; i++) {
      await this.page.keyboard.down(keys[i]);
      await sleep(randomBetween(28, 75));
    }
    await this.page.keyboard.press(keys[keys.length - 1]);
    for (let i = keys.length - 2; i >= 0; i--) {
      await sleep(randomBetween(18, 55));
      await this.page.keyboard.up(keys[i]);
    }
    logger.debug(`hotkey: ${keys.join('+')}`);
  }

  async waitForSelector(selector, opts = {}) {
    const { timeout = 15000, retries = 3, retryDelay = 1200 } = opts;
    let lastErr;
    for (let i = 0; i < retries; i++) {
      try {
        return await this.page.waitForSelector(selector, { timeout });
      } catch (err) {
        lastErr = err;
        logger.debug(`waitForSelector retry ${i + 1}/${retries}: ${selector}`);
        await sleep(retryDelay + randomBetween(0, 500));
      }
    }
    throw lastErr;
  }

  async waitForNavigation(opts = {}) {
    const { timeout = 30000, waitUntil = 'networkidle2' } = opts;
    return this.page.waitForNavigation({ timeout, waitUntil });
  }

  async screenshot(pathOrOpts, extra = {}) {
    const opts = typeof pathOrOpts === 'string'
      ? Object.assign({ path: pathOrOpts }, extra)
      : (pathOrOpts || {});
    return this.page.screenshot(opts);
  }
}

module.exports = { HumanLayer };
