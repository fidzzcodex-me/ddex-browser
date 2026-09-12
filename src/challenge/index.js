const { detectChallengeType } = require('./detector');
const { solveTurnstile } = require('./turnstile');
const { waitForInterstitial } = require('./interstitial');
const { waitForJSChallenge } = require('./js-detections');
const { solveManagedChallenge } = require('./managed');
const { waitForClearanceCookie } = require('./clearance');
const logger = require('../utils/logger');

class ChallengeHandler {
  constructor(onChallengeCallback) {
    this._onChallenge = onChallengeCallback || null;
  }

  async detect(page) {
    return detectChallengeType(page);
  }

  async solveTurnstile(page, options = {}) {
    return solveTurnstile(page, options);
  }

  async solveInterstitial(page, options = {}) {
    return waitForInterstitial(page, options);
  }

  async solveJSD(page, options = {}) {
    return waitForJSChallenge(page, options);
  }

  async solveManaged(page, options = {}) {
    return solveManagedChallenge(page, options);
  }

  async waitForClearance(page, options = {}) {
    return waitForClearanceCookie(page, {
      ...options,
      onChallenge: this._onChallenge,
    });
  }

  onChallenge(callback) {
    if (typeof callback !== 'function') throw new Error('onChallenge requires a function');
    this._onChallenge = callback;
  }
}

module.exports = { ChallengeHandler };
