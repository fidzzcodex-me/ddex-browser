const ccid = require('ccid-browser');

(async () => {
  const { browser, page } = await ccid.launch({
    headless: 'new',
    stealth: true,
    profile: 'windows-chrome',
    logLevel: ccid.LOG_LEVELS.DEBUG,
  });

  await page.goto('https://bot.sannysoft.com', { waitUntil: 'networkidle2' });

  await page.screenshot({ path: '/tmp/stealth-test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/stealth-test.png');

  await browser.close();
})();
