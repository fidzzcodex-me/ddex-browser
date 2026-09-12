const { CLOUDFLARE_CHALLENGE_TEXTS, CLOUDFLARE_IFRAME_ORIGINS, CHALLENGE_TYPES } = require('../constants');
const logger = require('../utils/logger');

async function detectChallengeType(page) {
  try {
    const [content, title, url] = await Promise.all([
      page.content().catch(() => ''),
      page.title().catch(() => ''),
      Promise.resolve(page.url()),
    ]);

    const hasCFText = CLOUDFLARE_CHALLENGE_TEXTS.some(t =>
      content.includes(t) || title.includes(t)
    );

    const hasCFUrl = url.includes('cdn-cgi/challenge')
      || url.includes('cf-chl-')
      || url.includes('challenges.cloudflare.com');

    if (!hasCFText && !hasCFUrl) {
      const iframeMatch = await page.evaluate((origins) => {
        const iframes = [...document.querySelectorAll('iframe')];
        return iframes.some(f => origins.some(o => (f.src || '').includes(o)));
      }, CLOUDFLARE_IFRAME_ORIGINS).catch(() => false);

      if (!iframeMatch) return CHALLENGE_TYPES.NONE;
      logger.debug('Turnstile iframe detected (no CF text)');
      return CHALLENGE_TYPES.TURNSTILE;
    }

    const analysis = await page.evaluate(() => {
      return {
        hasTurnstileIframe: !!(
          document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
          document.querySelector('[class*="cf-turnstile"]') ||
          document.querySelector('[data-sitekey]')
        ),
        hasChallengeForm: !!(
          document.querySelector('#challenge-form') ||
          document.querySelector('.cf-challenge-running') ||
          document.querySelector('#cf-challenge-running')
        ),
        hasInteractiveCheckbox: !!(
          document.querySelector('#challenge-form input[type="checkbox"]') ||
          document.querySelector('.ctp-checkbox-label')
        ),
        hasCFChlToken: !!(
          document.querySelector('[name="cf-turnstile-response"]') ||
          document.querySelector('[name="g-recaptcha-response"]')
        ),
        hasManagedUrl: window.location.href.includes('cf-chl'),
      };
    }).catch(() => ({}));

    if (analysis.hasTurnstileIframe || analysis.hasCFChlToken) {
      logger.debug('Challenge: TURNSTILE');
      return CHALLENGE_TYPES.TURNSTILE;
    }

    if (analysis.hasInteractiveCheckbox || analysis.hasChallengeForm) {
      logger.debug('Challenge: INTERSTITIAL');
      return CHALLENGE_TYPES.INTERSTITIAL;
    }

    if (analysis.hasManagedUrl || hasCFUrl) {
      logger.debug('Challenge: MANAGED');
      return CHALLENGE_TYPES.MANAGED;
    }

    if (hasCFText) {
      logger.debug('Challenge: JS_DETECTION');
      return CHALLENGE_TYPES.JS_DETECTION;
    }

    return CHALLENGE_TYPES.NONE;

  } catch (err) {
    logger.debug('Challenge detection error:', err.message);
    return CHALLENGE_TYPES.NONE;
  }
}

module.exports = { detectChallengeType };
