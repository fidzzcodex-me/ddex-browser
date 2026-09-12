const { UTILITY_WORLD_NAME, EVALUATE_SOURCE_URL } = require('../constants');
const logger = require('../utils/logger');

process.env['REBROWSER_PATCHES_RUNTIME_FIX_MODE'] = process.env['REBROWSER_PATCHES_RUNTIME_FIX_MODE'] || 'addBinding';
process.env['REBROWSER_PATCHES_SOURCE_URL'] = process.env['REBROWSER_PATCHES_SOURCE_URL'] || EVALUATE_SOURCE_URL;
process.env['REBROWSER_PATCHES_UTILITY_WORLD_NAME'] = process.env['REBROWSER_PATCHES_UTILITY_WORLD_NAME'] || UTILITY_WORLD_NAME;

async function patchAutomationFlags(page) {
  await page.evaluateOnNewDocument(() => {
    [
      'cdc_adoQpoasnfa76pfcZLmcfl_Array',
      'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
      'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
      '$chrome_asyncScriptInfo',
      '__$webdriverAsyncExecutor',
    ].forEach(k => { try { delete window[k]; } catch {} });

    Object.defineProperty(window, '_selenium', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '_Selenium_IDE_Recorder', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__webdriver_script_fn', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__driver_evaluate', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__webdriver_evaluate', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__fxdriver_evaluate', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__driver_unwrapped', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__webdriver_unwrapped', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__fxdriver_unwrapped', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__selenium_evaluate', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '__nightmare', { get: () => undefined, configurable: true });
    Object.defineProperty(window, 'callPhantom', { get: () => undefined, configurable: true });
    Object.defineProperty(window, '_phantom', { get: () => undefined, configurable: true });

    Object.defineProperty(MouseEvent.prototype, 'screenX', {
      get: function() { return this.clientX + (window.screenX || 0); },
      configurable: true,
    });
    Object.defineProperty(MouseEvent.prototype, 'screenY', {
      get: function() { return this.clientY + (window.screenY || 0); },
      configurable: true,
    });

    Object.defineProperty(MouseEvent.prototype, 'isTrusted', {
      get: function() { return true; },
      configurable: true,
    });

    Object.defineProperty(KeyboardEvent.prototype, 'isTrusted', {
      get: function() { return true; },
      configurable: true,
    });

    Object.defineProperty(PointerEvent.prototype, 'isTrusted', {
      get: function() { return true; },
      configurable: true,
    });

    const origGetParameter = WebGLRenderingContext.prototype.getParameter;
    const _randomInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

    const PRECISION_NOISE = Object.freeze({
      MAX_VERTEX_ATTRIBS: 16,
      MAX_VERTEX_UNIFORM_VECTORS: 4096,
      MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
      MAX_VARYING_VECTORS: 31,
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: 32,
      MAX_VERTEX_TEXTURE_IMAGE_UNITS: 16,
      MAX_TEXTURE_IMAGE_UNITS: 16,
    });
  });
}

async function applyCDPPatches(page) {
  await patchAutomationFlags(page);
  logger.debug('CDP patches applied');
}

module.exports = { applyCDPPatches };
