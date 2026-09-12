const { sleep, randomBetween, gaussianRandom, clamp } = require('./timing');

function bezierPoint(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
}

function generateControlPoints(sx, sy, ex, ey) {
  const dist = Math.hypot(ex - sx, ey - sy);
  const spread = Math.min(dist * 0.4, 180);

  return {
    cp1x: sx + (ex - sx) * 0.25 + gaussianRandom(0, spread),
    cp1y: sy + (ey - sy) * 0.15 + gaussianRandom(0, spread * 0.6),
    cp2x: sx + (ex - sx) * 0.75 + gaussianRandom(0, spread),
    cp2y: sy + (ey - sy) * 0.85 + gaussianRandom(0, spread * 0.6),
  };
}

function buildPath(sx, sy, ex, ey) {
  const { cp1x, cp1y, cp2x, cp2y } = generateControlPoints(sx, sy, ex, ey);
  const dist = Math.hypot(ex - sx, ey - sy);
  const steps = clamp(Math.round(dist / 8), 12, 80);
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jx = i > 0 && i < steps ? gaussianRandom(0, 1.2) : 0;
    const jy = i > 0 && i < steps ? gaussianRandom(0, 1.2) : 0;
    points.push({
      x: Math.round(bezierPoint(t, sx, cp1x, cp2x, ex) + jx),
      y: Math.round(bezierPoint(t, sy, cp1y, cp2y, ey) + jy),
    });
  }
  return points;
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

async function moveMouse(page, ex, ey, current = { x: 0, y: 0 }) {
  const dist = Math.hypot(ex - current.x, ey - current.y);
  if (dist < 2) return current;

  const path = buildPath(current.x, current.y, ex, ey);
  const totalMs = clamp(dist * randomBetween(0.4, 0.8) + gaussianRandom(60, 20), 80, 900);

  for (let i = 0; i < path.length; i++) {
    const pt = path[i];
    const progress = i / (path.length - 1);
    const speed = easeInOutSine(progress);
    const stepMs = Math.round((totalMs / path.length) * (1.5 - speed));
    await page.mouse.move(pt.x, pt.y);
    if (stepMs > 3) await sleep(clamp(stepMs, 3, 40));
  }

  const overshootChance = dist > 100 ? 0.35 : 0.15;
  if (Math.random() < overshootChance) {
    const ox = ex + gaussianRandom(0, 4);
    const oy = ey + gaussianRandom(0, 4);
    await page.mouse.move(Math.round(ox), Math.round(oy));
    await sleep(randomBetween(18, 55));
    await page.mouse.move(ex, ey);
  }

  return { x: ex, y: ey };
}

async function dispatchNaturalClick(page, x, y) {
  const holdMs = clamp(Math.round(gaussianRandom(82, 22)), 40, 200);
  await page.mouse.down();
  await sleep(holdMs);
  await page.mouse.up();
}

module.exports = { moveMouse, dispatchNaturalClick };
