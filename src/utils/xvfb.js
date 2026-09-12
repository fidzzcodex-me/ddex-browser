const { execSync, spawn } = require('child_process');
const logger = require('./logger');

let xvfbProcess = null;
let displayNum = 99;

function isLinuxHeadless() {
  if (process.platform !== 'linux') return false;
  try {
    const display = process.env.DISPLAY;
    if (!display) return true;
    execSync(`xdpyinfo -display ${display}`, { stdio: 'ignore', timeout: 2000 });
    return false;
  } catch {
    return true;
  }
}

function isXvfbAvailable() {
  try {
    execSync('which Xvfb', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

function startXvfb(display = displayNum) {
  return new Promise((resolve, reject) => {
    if (!isXvfbAvailable()) {
      return reject(new Error('Xvfb not found. Install with: apt-get install xvfb'));
    }

    displayNum = display;
    const displayStr = `:${display}`;

    xvfbProcess = spawn('Xvfb', [
      displayStr,
      '-screen', '0', '1280x800x24',
      '-ac',
      '+extension', 'GLX',
    ], {
      detached: false,
      stdio: 'ignore',
    });

    xvfbProcess.on('error', err => {
      logger.error('Xvfb spawn error:', err.message);
      reject(err);
    });

    setTimeout(() => {
      process.env.DISPLAY = displayStr;
      logger.info('Xvfb started on display', displayStr);
      resolve(displayStr);
    }, 500);
  });
}

function stopXvfb() {
  if (xvfbProcess) {
    try {
      xvfbProcess.kill('SIGTERM');
      xvfbProcess = null;
      logger.info('Xvfb stopped');
    } catch (err) {
      logger.warn('Failed to stop Xvfb:', err.message);
    }
  }
}

module.exports = { isLinuxHeadless, isXvfbAvailable, startXvfb, stopXvfb };
