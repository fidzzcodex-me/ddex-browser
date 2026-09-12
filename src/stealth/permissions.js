async function applyPermissionsPatches(page) {
  await page.evaluateOnNewDocument(() => {
    const STATE_MAP = {
      'geolocation': 'prompt',
      'notifications': 'default',
      'push': 'prompt',
      'midi': 'prompt',
      'camera': 'prompt',
      'microphone': 'prompt',
      'speaker-selection': 'prompt',
      'device-info': 'prompt',
      'background-fetch': 'prompt',
      'background-sync': 'granted',
      'bluetooth': 'prompt',
      'persistent-storage': 'prompt',
      'ambient-light-sensor': 'prompt',
      'accelerometer': 'granted',
      'gyroscope': 'granted',
      'magnetometer': 'prompt',
      'clipboard-read': 'prompt',
      'clipboard-write': 'granted',
      'payment-handler': 'prompt',
      'idle-detection': 'prompt',
      'periodic-background-sync': 'prompt',
      'system-wake-lock': 'prompt',
      'nfc': 'prompt',
      'window-management': 'prompt',
      'local-fonts': 'prompt',
      'display-capture': 'prompt',
      'screen-wake-lock': 'prompt',
      'accessibility-events': 'prompt',
      'clipboard': 'prompt',
      'top-level-storage-access': 'prompt',
      'storage-access': 'prompt',
    };

    if (window.Permissions && Permissions.prototype.query) {
      const origQuery = Permissions.prototype.query;
      Permissions.prototype.query = function(params) {
        if (!params || !params.name) return origQuery.call(this, params);

        const name = params.name.replace(/_/g, '-');
        const state = STATE_MAP[name];

        if (state !== undefined) {
          return Promise.resolve(
            Object.assign(Object.create(PermissionStatus.prototype), {
              state,
              onchange: null,
              name: params.name,
              addEventListener: function() {},
              removeEventListener: function() {},
              dispatchEvent: function() { return true; },
            })
          );
        }

        return origQuery.call(this, params).catch(() =>
          Promise.resolve({ state: 'prompt', onchange: null })
        );
      };
    }

    try {
      Object.defineProperty(Notification, 'permission', {
        get: () => 'default',
        configurable: true,
      });
      Object.defineProperty(Notification, 'maxActions', {
        get: () => 2,
        configurable: true,
      });
    } catch {}
  });
}

module.exports = { applyPermissionsPatches };
