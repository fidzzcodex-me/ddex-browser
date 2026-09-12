const fs = require('fs');
const path = require('path');

function checkPkg(name) {
  try {
    const pkgPath = path.resolve(__dirname, '../node_modules', name, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`[ccid-browser] ✓ ${name} ${pkg.version}`);
    return true;
  } catch {
    return false;
  }
}

const hasRebrowser = checkPkg('rebrowser-puppeteer-core');
const hasPuppeteer = checkPkg('puppeteer-core');

if (!hasRebrowser && !hasPuppeteer) {
  console.error('[ccid-browser] ✗ Neither rebrowser-puppeteer-core nor puppeteer-core found.');
  console.error('[ccid-browser]   Run: npm install rebrowser-puppeteer-core puppeteer-core');
  process.exit(1);
}

if (!hasRebrowser) {
  console.warn('[ccid-browser] ⚠ rebrowser-puppeteer-core not found — falling back to puppeteer-core.');
  console.warn('[ccid-browser]   CDP Runtime.enable patch INACTIVE. Detection risk elevated.');
  console.warn('[ccid-browser]   Install: npm install rebrowser-puppeteer-core');
}

if (hasRebrowser) {
  console.log('[ccid-browser] ✓ rebrowser-puppeteer-core active — Runtime.enable patch ON');
  console.log('[ccid-browser]   Fix mode: addBinding (default, best bypass rate)');
}

process.exit(0);
