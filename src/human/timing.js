function gaussianRandom(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Math.round(ms))));
}

function humanDelay(baseMean = 120, baseStd = 40, min = 40, max = 600) {
  return clamp(Math.round(gaussianRandom(baseMean, baseStd)), min, max);
}

function reactionDelay() {
  return clamp(Math.round(gaussianRandom(210, 65)), 100, 600);
}

function typeDelay(char) {
  const punctuation = ['.', ',', '!', '?', ';', ':'];
  const spaceOrEnter = [' ', '\n', '\r'];
  const capsOrSpecial = char !== char.toLowerCase() && char === char.toUpperCase();

  if (punctuation.includes(char)) return clamp(Math.round(gaussianRandom(220, 55)), 110, 650);
  if (spaceOrEnter.includes(char)) return clamp(Math.round(gaussianRandom(155, 45)), 70, 450);
  if (capsOrSpecial) return clamp(Math.round(gaussianRandom(140, 40)), 80, 400);
  return clamp(Math.round(gaussianRandom(95, 32)), 28, 340);
}

function scrollStepDelay(progress) {
  const factor = Math.sin(Math.PI * progress) + 0.1;
  return clamp(Math.round(gaussianRandom(35, 12) / factor), 8, 120);
}

module.exports = {
  gaussianRandom,
  clamp,
  randomBetween,
  sleep,
  humanDelay,
  reactionDelay,
  typeDelay,
  scrollStepDelay,
};
