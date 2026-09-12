let puppeteer;
let usingRebrowser = false;
try {
  puppeteer = require('rebrowser-puppeteer-core');
  usingRebrowser = true;
} catch {
  puppeteer = require('puppeteer-core');
}

const {
  DEFAULT_CHROME_ARGS,
  DEFAULT_VIEWPORT,
  DEFAULT_TIMEOUT,
  PROFILES,
} = require('./constants');
const { StealthLayer, resolveProfile, mergeProfile } = require('./stealth/index');
const { HumanLayer } = require('./human/index');
const { ChallengeHandler } = require('./challenge/index');
const { NetworkLayer, buildProxyArg, validateProxy } = require('./network/index');
const { isLinuxHeadless, startXvfb, stopXvfb } = require('./utils/xvfb');
const { saveCookies, loadCookies } = require('./utils/cookies');
const { saveStorage, loadStorage } = require('./utils/storage');
const logger = require('./utils/logger');

function validateOptions(opts) {
  if (opts.proxy && !Array.isArray(opts.proxy)) validateProxy(opts.proxy);
  const valid = Object.values(PROFILES);
  if (opts.profile && !valid.includes(opts.profile)) {
    throw new Error(`Invalid profile: "${opts.profile}". Valid: ${valid.join(', ')}`);
  }
  if (opts.headless !== undefined && ![true, false, 'new'].includes(opts.headless)) {
    throw new Error('headless must be true, false, or "new"');
  }
}

function resolveLogLevel(input) {
  if (typeof input === 'number') return input;
  return { silent: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 4 }[String(input).toLowerCase()] ?? 0;
}

function buildArgs(opts, profile) {
  const args = [...DEFAULT_CHROME_ARGS];

  if (opts.proxy && !Array.isArray(opts.proxy)) {
    const pa = buildProxyArg(opts.proxy);
    if (pa) args.push(pa);
  }

  const vp = opts.viewport || DEFAULT_VIEWPORT;
  args.push(`--window-size=${vp.width},${vp.height}`);
  args.push(`--lang=${profile.locale || 'en-US'}`);

  if (opts.userDataDir) args.push(`--user-data-dir=${opts.userDataDir}`);
  if (opts.geolocation) args.push('--enable-features=Geolocation');

  if (profile.colorDepth === 30) {
    args.push('--force-color-profile=display-p3-d65');
  }

  args.push('--disable-blink-features=AutomationControlled');
  args.push('--exclude-switches=enable-automation');

  return args;
}

async function launch(opts = {}) {
  validateOptions(opts);

  logger.setLevel(resolveLogLevel(opts.logLevel ?? opts.logger ?? 0));

  if (usingRebrowser) {
    process.env['REBROWSER_PATCHES_RUNTIME_FIX_MODE'] = opts.runtimeFixMode || 'addBinding';
    process.env['REBROWSER_PATCHES_SOURCE_URL'] = opts.sourceUrl || 'app.js';
    process.env['REBROWSER_PATCHES_UTILITY_WORLD_NAME'] = opts.utilityWorldName || 'util';
    logger.info('Engine: rebrowser-puppeteer-core (Runtime.enable patch: ACTIVE)');
  } else {
    logger.warn('Engine: puppeteer-core fallback (Runtime.enable patch: INACTIVE — install rebrowser-puppeteer-core)');
  }

  const profileName = opts.profile || PROFILES.WINDOWS_CHROME;
  const baseProfile = resolveProfile(profileName);
  const profile = mergeProfile(baseProfile, {
    userAgent: opts.userAgent || baseProfile.userAgent,
    timezone: opts.timezone || baseProfile.timezone,
    locale: opts.locale || baseProfile.locale,
    ...(opts.fingerprint || {}),
  });

  const headless = opts.headless !== undefined ? opts.headless : 'new';
  let xvfbStarted = false;

  if (headless === false && isLinuxHeadless()) {
    logger.info('Linux headless detected — starting Xvfb');
    await startXvfb();
    xvfbStarted = true;
  }

  const launchConfig = {
    headless,
    args: buildArgs(opts, profile),
    executablePath: opts.chromePath || process.env['CHROME_PATH'] || '/usr/bin/google-chrome',
    ignoreHTTPSErrors: true,
    defaultViewport: opts.viewport || DEFAULT_VIEWPORT,
    timeout: opts.timeout || DEFAULT_TIMEOUT,
    ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
  };

  if (opts.userDataDir) launchConfig.userDataDir = opts.userDataDir;

  let browser;
  try {
    browser = await puppeteer.launch(launchConfig);
  } catch (err) {
    if (xvfbStarted) stopXvfb();
    throw new Error(`Browser launch failed: ${err.message}`);
  }

  const page = await browser.newPage();

  await page.setUserAgent(profile.userAgent);
  await page.setViewport(opts.viewport || DEFAULT_VIEWPORT);

  if (profile.locale) {
    await page.setExtraHTTPHeaders({
      'Accept-Language': `${profile.locale},en;q=0.9`,
    });
  }

  if (opts.geolocation) {
    await page.setGeolocation(opts.geolocation).catch(e => logger.warn('Geolocation:', e.message));
  }

  if (opts.stealth !== false) {
    const stealth = new StealthLayer(page, profile);
    await stealth.apply();
  }

  const network = new NetworkLayer(page, profile, opts);
  await network.apply();

  const human = new HumanLayer(page);
  const challenge = new ChallengeHandler(opts.onChallenge || null);

  if (opts.turnstile === true) {
    _runTurnstileLoop(page, challenge);
  }

  browser.on('targetcreated', async (target) => {
    if (target.type() !== 'page') return;
    const newPage = await target.page().catch(() => null);
    if (!newPage) return;
    if (opts.stealth !== false) {
      await new StealthLayer(newPage, profile).apply().catch(e => logger.debug('New page stealth:', e.message));
    }
    await new NetworkLayer(newPage, profile, opts).apply().catch(e => logger.debug('New page network:', e.message));
  });

  const origClose = browser.close.bind(browser);
  browser.close = async function() {
    await origClose().catch(() => {});
    if (xvfbStarted) stopXvfb();
    logger.info('Browser closed');
  };

  logger.info(`Ready — profile: ${profileName}, headless: ${headless}`);

  return {
    browser,
    page,
    human,
    challenge,
    network,
    profile,
    saveCookies,
    loadCookies,
    saveStorage,
    loadStorage,
  };
}

function _runTurnstileLoop(page, challenge) {
  let alive = true;
  page.on('close', () => { alive = false; });

  (async () => {
    while (alive) {
      await challenge.solveTurnstile(page, { timeout: 5000, maxAttempts: 1 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }
  })().catch(() => {});
}

module.exports = { launch };
