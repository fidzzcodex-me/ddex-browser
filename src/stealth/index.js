const { applyCDPPatches } = require('./cdp-patches');
const { applyEvaluatePatches } = require('./evaluate-patch');
const { applyNavigatorPatches } = require('./navigator-patches');
const { applyWebGLPatches } = require('./webgl-patches');
const { applyChromeRuntime } = require('./chrome-runtime');
const { applyPermissionsPatches } = require('./permissions');
const { applyMediaDevicesPatches } = require('./media-devices');
const { applyBatteryPatches } = require('./battery');
const { applyWebRTCLeak } = require('./webrtc');
const { applyErrorStackPatch } = require('./error-stack');
const { runConsistencyCheck } = require('./consistency-check');
const { resolveProfile, mergeProfile } = require('./fingerprint');
const logger = require('../utils/logger');

class StealthLayer {
  constructor(page, profile) {
    this.page = page;
    this.profile = profile;
  }

  async apply() {
    runConsistencyCheck(this.profile);

    await applyCDPPatches(this.page);
    await applyEvaluatePatches(this.page);
    await applyNavigatorPatches(this.page, this.profile);
    await applyWebGLPatches(this.page, this.profile);
    await applyChromeRuntime(this.page, this.profile);
    await applyPermissionsPatches(this.page);
    await applyMediaDevicesPatches(this.page, this.profile);
    await applyBatteryPatches(this.page);
    await applyWebRTCLeak(this.page);
    await applyErrorStackPatch(this.page);

    await this._patchScreen();
    await this._patchConnection();
    await this._patchUserAgentData();
    await this._patchPerformance();
    await this._patchIntl();
    await this._patchObjectProtocol();

    logger.info('Stealth layer v3 fully applied');
  }

  async _patchScreen() {
    const p = this.profile;
    await this.page.evaluateOnNewDocument((profile) => {
      const def = (obj, prop, val) => {
        try {
          Object.defineProperty(obj, prop, { get: () => val, configurable: true });
        } catch {}
      };
      def(window.screen, 'width', profile.screenWidth);
      def(window.screen, 'height', profile.screenHeight);
      def(window.screen, 'availWidth', profile.screenWidth);
      def(window.screen, 'availHeight', profile.screenHeight - 40);
      def(window.screen, 'colorDepth', profile.colorDepth);
      def(window.screen, 'pixelDepth', profile.colorDepth);
      def(window, 'devicePixelRatio', profile.pixelRatio);
      def(window, 'outerWidth', profile.screenWidth);
      def(window, 'outerHeight', profile.screenHeight);
      def(window, 'screenX', 0);
      def(window, 'screenY', 0);
      def(window.screen, 'orientation', {
        type: 'landscape-primary',
        angle: 0,
        onchange: null,
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return true; },
      });
    }, p);
  }

  async _patchConnection() {
    await this.page.evaluateOnNewDocument(() => {
      const conn = Object.create(NetworkInformation ? NetworkInformation.prototype : Object.prototype);
      Object.defineProperties(conn, {
        downlink:       { value: parseFloat((9 + Math.random() * 4).toFixed(2)), configurable: true },
        downlinkMax:    { value: Infinity, configurable: true },
        effectiveType:  { value: '4g', configurable: true },
        rtt:            { value: Math.floor(50 + Math.random() * 30), configurable: true },
        saveData:       { value: false, configurable: true },
        type:           { value: 'unknown', configurable: true },
        onchange:       { value: null, configurable: true, writable: true },
        ontypechange:   { value: null, configurable: true, writable: true },
        addEventListener:    { value: function() {}, configurable: true },
        removeEventListener: { value: function() {}, configurable: true },
        dispatchEvent:       { value: function() { return true; }, configurable: true },
      });
      try {
        Object.defineProperty(Navigator.prototype, 'connection', {
          get: () => conn,
          configurable: true,
        });
      } catch {}
    });
  }

  async _patchUserAgentData() {
    const p = this.profile;
    if (!p.userAgent) return;

    const platform = p.platform === 'Win32' ? 'Windows'
      : p.platform === 'MacIntel' ? 'macOS'
      : 'Linux';

    const brands = [
      { brand: 'Google Chrome', version: '131' },
      { brand: 'Chromium', version: '131' },
      { brand: 'Not_A Brand', version: '24' },
    ];

    await this.page.evaluateOnNewDocument((data) => {
      const uad = {
        brands: data.brands,
        mobile: false,
        platform: data.platform,
        toJSON() {
          return { brands: this.brands, mobile: this.mobile, platform: this.platform };
        },
        getHighEntropyValues(hints) {
          const r = {};
          const hintMap = {
            brands: data.brands,
            mobile: false,
            platform: data.platform,
            platformVersion: data.platformVersion,
            architecture: 'x86',
            bitness: '64',
            model: '',
            uaFullVersion: '131.0.6778.204',
            fullVersionList: data.brands.map(b => ({
              brand: b.brand,
              version: b.brand === 'Not_A Brand' ? '24.0.0.0' : '131.0.6778.204',
            })),
            wow64: false,
          };
          hints.forEach(h => { if (hintMap[h] !== undefined) r[h] = hintMap[h]; });
          return Promise.resolve(r);
        },
      };

      try {
        Object.defineProperty(Navigator.prototype, 'userAgentData', {
          get: () => uad,
          configurable: true,
        });
      } catch {}
    }, { brands, platform, platformVersion: platform === 'Windows' ? '15.0.0' : platform === 'macOS' ? '14.0.0' : '6.5.0' });
  }

  async _patchPerformance() {
    await this.page.evaluateOnNewDocument(() => {
      const origNow = performance.now.bind(performance);
      let _offset = Math.random() * 0.08 - 0.04;
      Object.defineProperty(performance, 'now', {
        value: function now() {
          return origNow() + _offset;
        },
        configurable: true,
        writable: true,
      });
    });
  }

  async _patchIntl() {
    const p = this.profile;
    await this.page.evaluateOnNewDocument((tz) => {
      const OrigDateTimeFormat = Intl.DateTimeFormat;
      function PatchedDateTimeFormat(locales, options = {}) {
        if (!options.timeZone) options = { ...options, timeZone: tz };
        return new OrigDateTimeFormat(locales, options);
      }
      PatchedDateTimeFormat.prototype = OrigDateTimeFormat.prototype;
      PatchedDateTimeFormat.supportedLocalesOf = OrigDateTimeFormat.supportedLocalesOf;
      try { Intl.DateTimeFormat = PatchedDateTimeFormat; } catch {}
    }, p.timezone || 'America/New_York');
  }

  async _patchObjectProtocol() {
    await this.page.evaluateOnNewDocument(() => {
      const origGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
      Object.getOwnPropertyDescriptor = function(obj, prop) {
        if (prop === 'webdriver') return undefined;
        return origGetOwnPropertyDescriptor.call(this, obj, prop);
      };

      const origGetOwnPropertyNames = Object.getOwnPropertyNames;
      Object.getOwnPropertyNames = function(obj) {
        const names = origGetOwnPropertyNames.call(this, obj);
        return names.filter(n => n !== 'webdriver');
      };
    });
  }
}

module.exports = { StealthLayer, resolveProfile, mergeProfile };
