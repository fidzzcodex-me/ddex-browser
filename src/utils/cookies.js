const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function saveCookies(page, filePath) {
  if (!filePath) throw new Error('filePath required for saveCookies');

  const cookies = await page.cookies();
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2), 'utf8');
  logger.info(`Cookies saved to ${filePath} (${cookies.length} entries)`);
  return cookies;
}

async function loadCookies(page, filePath) {
  if (!filePath) throw new Error('filePath required for loadCookies');

  if (!fs.existsSync(filePath)) {
    logger.warn(`Cookie file not found: ${filePath}`);
    return [];
  }

  let cookies;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    cookies = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse cookie file: ${err.message}`);
  }

  if (!Array.isArray(cookies)) {
    throw new Error('Cookie file must contain an array');
  }

  await page.setCookie(...cookies);
  logger.info(`Cookies loaded from ${filePath} (${cookies.length} entries)`);
  return cookies;
}

module.exports = { saveCookies, loadCookies };
