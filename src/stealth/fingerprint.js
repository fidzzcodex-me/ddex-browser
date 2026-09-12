const { PROFILES } = require('../constants');

const profileMap = {
  [PROFILES.WINDOWS_CHROME]: require('../profiles/windows-chrome'),
  [PROFILES.MACOS_CHROME]: require('../profiles/macos-chrome'),
  [PROFILES.LINUX_CHROME]: require('../profiles/linux-chrome'),
};

function resolveProfile(profileName) {
  const name = profileName || PROFILES.WINDOWS_CHROME;
  const profile = profileMap[name];

  if (!profile) {
    throw new Error(`Unknown profile: "${name}". Available: ${Object.keys(profileMap).join(', ')}`);
  }

  return profile;
}

function mergeProfile(base, overrides = {}) {
  return Object.assign({}, base, overrides);
}

module.exports = { resolveProfile, mergeProfile };
