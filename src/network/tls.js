const logger = require('../utils/logger');

function isCurlImpersonateAvailable() {
  try {
    const { execSync } = require('child_process');
    execSync('which curl-impersonate-chrome', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

function getTLSNote() {
  const available = isCurlImpersonateAvailable();
  if (!available) {
    logger.debug('curl-impersonate not found — TLS fingerprint will be Node.js default');
    logger.debug('For JA3/JA4 bypass, install curl-impersonate: https://github.com/lwthiker/curl-impersonate');
  }
  return available;
}

async function applyTLSInterception(page, profile) {
  await page.setRequestInterception(false).catch(() => {});
  getTLSNote();
}

module.exports = { getTLSNote, isCurlImpersonateAvailable, applyTLSInterception };
