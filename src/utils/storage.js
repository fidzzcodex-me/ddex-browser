const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function saveStorage(page, filePath) {
  if (!filePath) throw new Error('filePath required for saveStorage');

  const data = await page.evaluate(() => {
    const local = {};
    const session = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      local[key] = localStorage.getItem(key);
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      session[key] = sessionStorage.getItem(key);
    }

    return { localStorage: local, sessionStorage: session };
  });

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  logger.info(`Storage saved to ${filePath}`);
  return data;
}

async function loadStorage(page, filePath) {
  if (!filePath) throw new Error('filePath required for loadStorage');

  if (!fs.existsSync(filePath)) {
    logger.warn(`Storage file not found: ${filePath}`);
    return null;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse storage file: ${err.message}`);
  }

  await page.evaluate((stored) => {
    if (stored.localStorage) {
      for (const [key, val] of Object.entries(stored.localStorage)) {
        try { localStorage.setItem(key, val); } catch {}
      }
    }
    if (stored.sessionStorage) {
      for (const [key, val] of Object.entries(stored.sessionStorage)) {
        try { sessionStorage.setItem(key, val); } catch {}
      }
    }
  }, data);

  logger.info(`Storage loaded from ${filePath}`);
  return data;
}

module.exports = { saveStorage, loadStorage };
