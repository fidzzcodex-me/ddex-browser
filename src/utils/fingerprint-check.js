const logger = require('./logger');

const RULES = [
  {
    name: 'UA-Platform',
    check: (p) => {
      if (!p.userAgent || !p.platform) return true;
      const ua = p.userAgent.toLowerCase();
      if (p.platform === 'Win32') return ua.includes('windows');
      if (p.platform === 'MacIntel') return ua.includes('macintosh') || ua.includes('mac os');
      if (p.platform.startsWith('Linux')) return ua.includes('linux') || ua.includes('x11');
      return true;
    },
  },
  {
    name: 'WebGL-Platform',
    check: (p) => {
      if (!p.webglVendor || !p.platform) return true;
      const v = p.webglVendor.toLowerCase();
      if (p.platform === 'Win32') return v.includes('intel') || v.includes('nvidia') || v.includes('amd') || v.includes('google');
      if (p.platform === 'MacIntel') return v.includes('apple') || v.includes('intel') || v.includes('google');
      if (p.platform.startsWith('Linux')) return v.includes('mesa') || v.includes('intel') || v.includes('google');
      return true;
    },
  },
  {
    name: 'No SwiftShader',
    check: (p) => !p.webglRenderer || !p.webglRenderer.toLowerCase().includes('swiftshader'),
  },
  {
    name: 'hardwareConcurrency',
    check: (p) => !p.hardwareConcurrency || [2, 4, 6, 8, 10, 12, 16, 24, 32].includes(p.hardwareConcurrency),
  },
  {
    name: 'deviceMemory',
    check: (p) => !p.deviceMemory || [1, 2, 4, 8].includes(p.deviceMemory),
  },
  {
    name: 'colorDepth',
    check: (p) => !p.colorDepth || [24, 30, 32].includes(p.colorDepth),
  },
  {
    name: 'pixelRatio',
    check: (p) => !p.pixelRatio || [1, 1.25, 1.5, 2, 2.5, 3].includes(p.pixelRatio),
  },
  {
    name: 'languages',
    check: (p) => !p.languages || (Array.isArray(p.languages) && p.languages.length > 0),
  },
  {
    name: 'screenDimensions',
    check: (p) => {
      if (!p.screenWidth || !p.screenHeight) return true;
      const ratio = p.screenWidth / p.screenHeight;
      return ratio > 1.0 && ratio < 3.5;
    },
  },
];

function runConsistencyCheck(profile) {
  const failures = [];
  for (const rule of RULES) {
    try {
      if (!rule.check(profile)) {
        failures.push(rule.name);
        logger.warn(`Fingerprint: FAIL [${rule.name}]`);
      }
    } catch (err) {
      logger.debug(`Fingerprint check error [${rule.name}]:`, err.message);
    }
  }

  if (failures.length > 0) {
    logger.warn(`${failures.length} fingerprint issue(s) — detection risk elevated`);
    return false;
  }

  logger.info('Fingerprint: all checks passed');
  return true;
}

module.exports = { runConsistencyCheck };
