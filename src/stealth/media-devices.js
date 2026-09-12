const DEVICE_PROFILES = {
  'Win32': [
    { kind: 'audioinput',  label: '', deviceId: 'default',        groupId: 'default' },
    { kind: 'audioinput',  label: '', deviceId: 'communications', groupId: 'communications' },
    { kind: 'audiooutput', label: '', deviceId: 'default',        groupId: 'default' },
    { kind: 'audiooutput', label: '', deviceId: 'communications', groupId: 'communications' },
    { kind: 'videoinput',  label: '', deviceId: '',               groupId: '' },
  ],
  'MacIntel': [
    { kind: 'audioinput',  label: '', deviceId: 'default', groupId: 'default' },
    { kind: 'audiooutput', label: '', deviceId: 'default', groupId: 'default' },
    { kind: 'videoinput',  label: '', deviceId: '',        groupId: '' },
  ],
  'Linux x86_64': [
    { kind: 'audioinput',  label: '', deviceId: 'default', groupId: 'default' },
    { kind: 'audiooutput', label: '', deviceId: 'default', groupId: 'default' },
    { kind: 'videoinput',  label: '', deviceId: '',        groupId: '' },
  ],
};

async function applyMediaDevicesPatches(page, profile) {
  const devices = DEVICE_PROFILES[profile.platform] || DEVICE_PROFILES['Win32'];

  await page.evaluateOnNewDocument((deviceList) => {
    if (!navigator.mediaDevices) return;

    const makeFakeDevice = (d) => {
      const info = {};
      Object.defineProperties(info, {
        deviceId:    { value: d.deviceId,  enumerable: true, configurable: true },
        kind:        { value: d.kind,      enumerable: true, configurable: true },
        label:       { value: d.label,     enumerable: true, configurable: true },
        groupId:     { value: d.groupId,   enumerable: true, configurable: true },
        toJSON:      { value: function() { return { deviceId: d.deviceId, kind: d.kind, label: d.label, groupId: d.groupId }; }, configurable: true },
      });
      try { Object.setPrototypeOf(info, MediaDeviceInfo.prototype); } catch {}
      return info;
    };

    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
      value: function enumerateDevices() {
        return Promise.resolve(deviceList.map(makeFakeDevice));
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(navigator.mediaDevices, 'getSupportedConstraints', {
      value: function getSupportedConstraints() {
        return {
          width: true, height: true, aspectRatio: true, frameRate: true,
          facingMode: true, resizeMode: true, volume: true, sampleRate: true,
          sampleSize: true, echoCancellation: true, autoGainControl: true,
          noiseSuppression: true, latency: true, channelCount: true,
          deviceId: true, groupId: true,
        };
      },
      configurable: true,
    });
  }, devices);
}

module.exports = { applyMediaDevicesPatches };
