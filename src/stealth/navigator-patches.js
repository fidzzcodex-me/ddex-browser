async function applyNavigatorPatches(page, profile) {
  await page.evaluateOnNewDocument((p) => {
    const def = (obj, prop, val) => {
      try {
        Object.defineProperty(obj, prop, {
          get: () => val,
          set: undefined,
          configurable: true,
          enumerable: true,
        });
      } catch {}
    };

    def(Navigator.prototype, 'webdriver', undefined);
    def(Navigator.prototype, 'platform', p.platform);
    def(Navigator.prototype, 'vendor', p.vendor);
    def(Navigator.prototype, 'hardwareConcurrency', p.hardwareConcurrency);
    def(Navigator.prototype, 'deviceMemory', p.deviceMemory);
    def(Navigator.prototype, 'language', p.languages[0]);
    def(Navigator.prototype, 'languages', Object.freeze([...p.languages]));

    if (p.oscpu !== undefined) {
      def(Navigator.prototype, 'oscpu', p.oscpu);
    }

    def(Navigator.prototype, 'appVersion', p.appVersion);
    def(Navigator.prototype, 'pdfViewerEnabled', true);
    def(Navigator.prototype, 'cookieEnabled', true);
    def(Navigator.prototype, 'onLine', true);
    def(Navigator.prototype, 'javaEnabled', function javaEnabled() { return false; });

    const pdfPlugin = (name, filename, desc, types) => {
      const plugin = Object.create(Plugin.prototype);
      def(plugin, 'name', name);
      def(plugin, 'filename', filename);
      def(plugin, 'description', desc);
      def(plugin, 'length', types.length);
      types.forEach((t, i) => { plugin[i] = t; plugin[t.type] = t; });
      return plugin;
    };

    const makeMime = (type, suffix, desc) => {
      const mt = Object.create(MimeType.prototype);
      def(mt, 'type', type);
      def(mt, 'suffixes', suffix);
      def(mt, 'description', desc);
      return mt;
    };

    const mt1 = makeMime('application/x-google-chrome-pdf', 'pdf', 'Portable Document Format');
    const mt2 = makeMime('application/pdf', 'pdf', 'Portable Document Format');
    const mt3 = makeMime('application/x-nacl', '', '');

    const pluginList = [
      pdfPlugin('Chrome PDF Plugin', 'internal-pdf-viewer', 'Portable Document Format', [mt1]),
      pdfPlugin('Chrome PDF Viewer', 'mhjfbmdgcfjbbpaeojofohoefgiehjai', '', [mt2]),
      pdfPlugin('Native Client', 'internal-nacl-plugin', '', [mt3]),
    ];

    const fakePlugins = Object.create(PluginArray.prototype);
    pluginList.forEach((pl, i) => {
      fakePlugins[i] = pl;
      fakePlugins[pl.name] = pl;
    });
    def(fakePlugins, 'length', pluginList.length);
    fakePlugins.item = (n) => fakePlugins[n] ?? null;
    fakePlugins.namedItem = (n) => fakePlugins[n] ?? null;
    fakePlugins[Symbol.iterator] = function* () { for (let i = 0; i < pluginList.length; i++) yield pluginList[i]; };
    def(Navigator.prototype, 'plugins', fakePlugins);

    const fakeMimes = Object.create(MimeTypeArray.prototype);
    [mt1, mt2, mt3].forEach((m, i) => {
      fakeMimes[i] = m;
      fakeMimes[m.type] = m;
    });
    def(fakeMimes, 'length', 3);
    fakeMimes.item = (n) => fakeMimes[n] ?? null;
    fakeMimes.namedItem = (n) => fakeMimes[n] ?? null;
    fakeMimes[Symbol.iterator] = function* () { yield mt1; yield mt2; yield mt3; };
    def(Navigator.prototype, 'mimeTypes', fakeMimes);

    const origQuery = Permissions.prototype.query;
    Permissions.prototype.query = function(params) {
      if (!params || !params.name) return origQuery.call(this, params);
      if (params.name === 'notifications') {
        return Promise.resolve(Object.assign(Object.create(PermissionStatus.prototype), {
          state: 'default',
          onchange: null,
        }));
      }
      return origQuery.call(this, params).catch(() =>
        Promise.resolve({ state: 'prompt', onchange: null })
      );
    };

    const nativeConcurrency = Object.getOwnPropertyDescriptor(Navigator.prototype, 'hardwareConcurrency');
    if (nativeConcurrency && typeof nativeConcurrency.get === 'function') {
      try {
        const origStr = Function.prototype.toString.call(nativeConcurrency.get);
        if (origStr.includes('native code')) {
          const fakeGet = function() { return p.hardwareConcurrency; };
          Object.defineProperty(fakeGet, 'name', { value: 'get hardwareConcurrency' });
          def(Navigator.prototype, 'hardwareConcurrency', undefined);
          Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', {
            get: fakeGet,
            configurable: true,
            enumerable: true,
          });
        }
      } catch {}
    }

  }, profile);
}

module.exports = { applyNavigatorPatches };
