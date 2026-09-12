const DEFAULT_TIMEOUT = 30000;
const DEFAULT_NAVIGATION_TIMEOUT = 60000;
const DEFAULT_CHALLENGE_TIMEOUT = 45000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const DEFAULT_LOCALE = 'en-US';
const DEFAULT_TIMEZONE = 'America/New_York';

const UTILITY_WORLD_NAME = 'util';
const EVALUATE_SOURCE_URL = 'app.js';

const CLOUDFLARE_CHALLENGE_TEXTS = [
  'Verify you are human',
  'Checking your browser',
  'Just a moment',
  'Please wait',
  'DDoS protection by Cloudflare',
  'Attention Required',
  'One more step',
  'Enable JavaScript and cookies to continue',
  'Performance & security by Cloudflare',
];

const CLOUDFLARE_IFRAME_ORIGINS = [
  'challenges.cloudflare.com',
];

const CLOUDFLARE_CLEARANCE_COOKIE = 'cf_clearance';

const CHALLENGE_TYPES = {
  TURNSTILE: 'turnstile',
  INTERSTITIAL: 'interstitial',
  JS_DETECTION: 'js_detection',
  MANAGED: 'managed',
  NONE: 'none',
};

const LOG_LEVELS = {
  SILENT: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 4,
};

const PROFILES = {
  WINDOWS_CHROME: 'windows-chrome',
  MACOS_CHROME: 'macos-chrome',
  LINUX_CHROME: 'linux-chrome',
};

const DEFAULT_CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-infobars',
  '--window-position=0,0',
  '--ignore-certificate-errors',
  '--ignore-certificate-errors-spki-list',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-features=TranslateUI,BlinkGenPropertyTrees,ImprovedCookieControls,SameSiteByDefaultCookies,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-sync',
  '--force-color-profile=srgb',
  '--metrics-recording-only',
  '--safebrowsing-disable-auto-update',
  '--enable-automation=false',
  '--password-store=basic',
  '--use-mock-keychain',
  '--disable-blink-features=AutomationControlled',
  '--exclude-switches=enable-automation',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
  '--disable-web-security',
  '--allow-running-insecure-content',
];

module.exports = {
  DEFAULT_TIMEOUT,
  DEFAULT_NAVIGATION_TIMEOUT,
  DEFAULT_CHALLENGE_TIMEOUT,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_VIEWPORT,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  UTILITY_WORLD_NAME,
  EVALUATE_SOURCE_URL,
  CLOUDFLARE_CHALLENGE_TEXTS,
  CLOUDFLARE_IFRAME_ORIGINS,
  CLOUDFLARE_CLEARANCE_COOKIE,
  CHALLENGE_TYPES,
  LOG_LEVELS,
  PROFILES,
  DEFAULT_CHROME_ARGS,
};
