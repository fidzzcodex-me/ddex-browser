const BLOCKED = [
  'pptr:', '__puppeteer', 'puppeteer-core',
  'node_modules/puppeteer', '__util_ctx__',
  'evaluateHandle', 'EVALUATION_SCRIPT_URL',
];

async function applyErrorStackPatch(page) {
  await page.evaluateOnNewDocument((blocked) => {
    const filter = (str) => {
      if (typeof str !== 'string') return str;
      return str.split('\n').filter(l => !blocked.some(b => l.includes(b))).join('\n');
    };

    const origDescriptor = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
    if (origDescriptor && origDescriptor.get) {
      Object.defineProperty(Error.prototype, 'stack', {
        get: function() {
          return filter(origDescriptor.get.call(this));
        },
        configurable: true,
      });
    }

    const origPrepare = Error.prepareStackTrace;
    Error.prepareStackTrace = function(err, frames) {
      const result = origPrepare
        ? origPrepare.call(this, err, frames)
        : frames.map(f => `    at ${f}`).join('\n');
      return typeof result === 'string' ? filter(result) : result;
    };

    const nativeToString = Function.prototype.toString;
    Object.defineProperty(Function.prototype, 'toString', {
      value: function toString() {
        const s = nativeToString.call(this);
        if (blocked.some(b => s.includes(b))) {
          return `function ${this.name || ''}() { [native code] }`;
        }
        return s;
      },
      writable: true,
      configurable: true,
    });

  }, BLOCKED);
}

module.exports = { applyErrorStackPatch };
