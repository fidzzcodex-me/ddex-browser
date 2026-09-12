async function applyBatteryPatches(page) {
  await page.evaluateOnNewDocument(() => {
    const level = parseFloat((0.72 + Math.random() * 0.24).toFixed(2));
    const charging = Math.random() > 0.45;

    const batteryObj = {
      charging,
      chargingTime: charging ? Math.floor(Math.random() * 3600 + 600) : Infinity,
      dischargingTime: charging ? Infinity : Math.floor(Math.random() * 7200 + 1800),
      level,
      onchargingchange: null,
      onchargingtimechange: null,
      ondischargingtimechange: null,
      onlevelchange: null,
      addEventListener: function(type, fn) {},
      removeEventListener: function(type, fn) {},
      dispatchEvent: function(event) { return true; },
    };

    Object.setPrototypeOf(batteryObj, EventTarget.prototype);

    if (typeof navigator.getBattery === 'function') {
      const origGetBattery = navigator.getBattery.bind(navigator);
      Object.defineProperty(Navigator.prototype, 'getBattery', {
        value: function getBattery() {
          return Promise.resolve(batteryObj);
        },
        configurable: true,
        writable: true,
      });
    }
  });
}

module.exports = { applyBatteryPatches };
