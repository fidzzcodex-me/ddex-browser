const { UTILITY_WORLD_NAME, EVALUATE_SOURCE_URL } = require('../constants');
const logger = require('../utils/logger');

const PPTR_PATTERNS = [
  /pptr:/,
  /__puppeteer/,
  /puppeteer-core/,
  /node_modules\/puppeteer/,
  /HeapProfiler\./,
];

function patchEvaluateSourceUrl(page) {
  const orig = page.evaluate.bind(page);
  page.evaluate = function(fn, ...args) {
    if (typeof fn === 'string') {
      fn = fn.replace(/\/\/# sourceURL=pptr:[^\s\n]*/g, `//# sourceURL=${EVALUATE_SOURCE_URL}`);
    }
    return orig(fn, ...args);
  };
}

async function applyEvaluatePatches(page) {
  patchEvaluateSourceUrl(page);

  await page.evaluateOnNewDocument(() => {
    const BLOCKED = [
      'pptr:', '__puppeteer', 'puppeteer-core',
      'node_modules/puppeteer', '__util_ctx__', '__isolated_world__',
    ];

    const _nativeToString = Function.prototype.toString;

    Object.defineProperty(Function.prototype, 'toString', {
      value: function toString() {
        const result = _nativeToString.call(this);
        if (BLOCKED.some(b => result.includes(b))) {
          return `function ${this.name || ''}() { [native code] }`;
        }
        return result;
      },
      writable: true,
      configurable: true,
    });

    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function(err, frames) {
      if (_prepareStackTrace) {
        try {
          const result = _prepareStackTrace.call(this, err, frames);
          if (typeof result === 'string') {
            return result.split('\n')
              .filter(l => !BLOCKED.some(b => l.includes(b)))
              .join('\n');
          }
        } catch {}
      }
      return undefined;
    };

    const _origStack = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
    if (_origStack) {
      Object.defineProperty(Error.prototype, 'stack', {
        get: function() {
          const raw = _origStack.get ? _origStack.get.call(this) : this._stack;
          if (typeof raw !== 'string') return raw;
          return raw.split('\n')
            .filter(l => !BLOCKED.some(b => l.includes(b)))
            .join('\n');
        },
        configurable: true,
      });
    }
  });

  logger.debug('Evaluate patches applied');
}

module.exports = { applyEvaluatePatches };
