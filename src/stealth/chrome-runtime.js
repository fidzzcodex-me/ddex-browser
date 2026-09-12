async function applyChromeRuntime(page, profile) {
  await page.evaluateOnNewDocument((p) => {
    const now = Date.now();
    const origin = performance.timeOrigin;

    const loadTimes = Object.freeze({
      requestTime: (origin - 200 - Math.random() * 800) / 1000,
      startLoadTime: (origin - 150 - Math.random() * 300) / 1000,
      commitLoadTime: (origin - 80 - Math.random() * 120) / 1000,
      finishDocumentLoadTime: 0,
      finishLoadTime: 0,
      firstPaintTime: 0,
      firstPaintAfterLoadTime: 0,
      navigationType: 'Other',
      wasFetchedViaSpdy: true,
      wasNpnNegotiated: true,
      npnNegotiatedProtocol: 'h2',
      wasAlternateProtocolAvailable: false,
      connectionInfo: 'h2',
    });

    const csiData = Object.freeze({
      startE: now - Math.floor(Math.random() * 500 + 200),
      onloadT: now - Math.floor(Math.random() * 200 + 50),
      pageT: Math.random() * 3200 + 600,
      tran: 15,
    });

    const chrome = window.chrome || {};

    if (!chrome.runtime) {
      chrome.runtime = {
        id: undefined,
        connect: undefined,
        sendMessage: undefined,
        onMessage: { addListener: function() {}, removeListener: function() {}, hasListener: function() { return false; } },
        OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
      };
    }

    if (!chrome.app) {
      chrome.app = {
        isInstalled: false,
        getDetails: function getDetails() { return null; },
        getIsInstalled: function getIsInstalled() { return false; },
        installState: function installState(cb) { if (cb) cb('disabled'); },
        runningState: function runningState() { return 'cannot_run'; },
      };
    }

    if (!chrome.csi) {
      chrome.csi = function csi() { return csiData; };
    }

    if (!chrome.loadTimes) {
      chrome.loadTimes = function loadTimes() { return loadTimes; };
    }

    Object.defineProperty(window, 'chrome', {
      value: chrome,
      writable: true,
      configurable: true,
    });
  }, profile);
}

module.exports = { applyChromeRuntime };
