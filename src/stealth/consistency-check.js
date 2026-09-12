const logger = require('../utils/logger');

const RULES = [
  {
    name: 'UA-Platform match',
    check: (p) => {
      if (!p.userAgent || !p.platform) return true;
      const uaLower = p.userAgent.toLowerCase();
      if (p.platform === 'Win32') return uaLower.includes('windows');
      if (p.platform === 'MacIntel') return uaLower.includes('macintosh') || uaLower.includes('mac os');
      if (p.platform.startsWith('Linux')) return uaLower.includes('linux') || uaLower.includes('x11');
      return true;
    },
  },
  {
    name: 'WebGL-Platform match',
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
    name: 'hardwareConcurrency range',
    check: (p) => !p.hardwareConcurrency || [2, 4, 6, 8, 12, 16, 24, 32].includes(p.hardwareConcurrency),
  },
  {
    name: 'deviceMemory range',
    check: (p) => !p.deviceMemory || [1, 2, 4, 8].includes(p.deviceMemory),
  },
  {
    name: 'colorDepth natural',
    check: (p) => !p.colorDepth || [24, 30, 32].includes(p.colorDepth),
  },
  {
    name: 'pixelRatio natural',
    check: (p) => !p.pixelRatio || [1, 1.25, 1.5, 2, 2.5, 3].includes(p.pixelRatio),
  },
  {
    name: 'languages array',
    check: (p) => !p.languages || (Array.isArray(p.languages) && p.languages.length > 0),
  },
];

function runConsistencyCheck(profile) {
  const failures = [];

  for (const rule of RULES) {
    try {
      if (!rule.check(profile)) {
        failures.push(rule.name);
        logger.warn(`Fingerprint inconsistency: ${rule.name}`);
      }
    } catch (err) {
      logger.debug(`Consistency check error for "${rule.name}":`, err.message);
    }
  }

  if (failures.length > 0) {
    logger.warn(`${failures.length} fingerprint inconsistencies detected. Detection risk elevated.`);
    return false;
  }

  logger.info('Fingerprint consistency: all checks passed');
  return true;
}

module.exports = { runConsistencyCheck };
