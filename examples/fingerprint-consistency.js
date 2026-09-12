const ccid = require('ccid-browser');

const PROFILES_TO_TEST = ['windows-chrome', 'macos-chrome', 'linux-chrome'];

(async () => {
  for (const profileName of PROFILES_TO_TEST) {
    console.log(`\n--- Testing profile: ${profileName} ---`);

    const profile = ccid.getProfile(profileName);
    console.log('UA:', profile.userAgent.substring(0, 60) + '...');
    console.log('Platform:', profile.platform);
    console.log('WebGL Vendor:', profile.webglVendor);
    console.log('WebGL Renderer:', profile.webglRenderer);

    const { browser, page, human } = await ccid.launch({
      headless: 'new',
      stealth: true,
      profile: profileName,
      logLevel: 'warn',
    });

    const results = await page.goto('https://bot.sannysoft.com')
      .then(() => page.evaluate(() => {
        const rows = [...document.querySelectorAll('table tr')];
        const data = {};
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            data[cells[0].textContent.trim()] = cells[1].textContent.trim();
          }
        });
        return data;
      }))
      .catch(() => ({}));

    const checks = ['User Agent', 'WebDriver', 'Chrome', 'Permissions', 'Plugins Length'];
    checks.forEach(check => {
      const val = results[check] || 'N/A';
      const ok = !val.toLowerCase().includes('missing') && !val.toLowerCase().includes('headless');
      console.log(`  ${ok ? '✓' : '✗'} ${check}: ${val}`);
    });

    await human.screenshot(`/tmp/fp-${profileName}.png`, { fullPage: true });
    await browser.close();
  }

  console.log('\nFingerprint consistency test complete.');
})();
