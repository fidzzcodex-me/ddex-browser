const { PROFILES } = require('../constants');

const profileMap = {
  [PROFILES.WINDOWS_CHROME]: require('./windows-chrome'),
  [PROFILES.MACOS_CHROME]: require('./macos-chrome'),
  [PROFILES.LINUX_CHROME]: require('./linux-chrome'),
};

function getProfile(name) {
  const profile = profileMap[name];
  if (!profile) {
    throw new Error(`Unknown profile: "${name}". Available: ${Object.keys(profileMap).join(', ')}`);
  }
  return profile;
}

function listProfiles() {
  return Object.keys(profileMap);
}

module.exports = { getProfile, listProfiles, profileMap };
