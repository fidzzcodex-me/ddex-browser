const ccid = require('ccid-browser');

(async () => {
  const { browser, page, human, challenge } = await ccid.launch({
    headless: false,
    stealth: true,
    turnstile: true,
    profile: 'windows-chrome',
    logLevel: 'info',
    onChallenge: (type) => console.log('[ccid] Challenge:', type),
  });

  await page.goto('https://nowsecure.nl', { waitUntil: 'domcontentloaded' });

  await challenge.solveManaged(page, { timeout: 45000, maxAttempts: 5 });
  await challenge.waitForClearance(page, { timeout: 60000 });

  console.log('Managed challenge cleared — URL:', page.url());
  await human.screenshot('/tmp/managed-cleared.png');
  await browser.close();
})();
