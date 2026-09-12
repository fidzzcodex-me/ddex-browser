const ccid = require('ccid-browser');

(async () => {
  const { browser, page, human, challenge } = await ccid.launch({
    headless: false,
    stealth: true,
    profile: 'windows-chrome',
    onChallenge: (type) => console.log('[ccid] Challenge detected:', type),
  });

  await page.goto('https://nowsecure.nl', { waitUntil: 'domcontentloaded' });

  const type = await challenge.detect(page);
  console.log('Challenge type:', type);

  if (type === ccid.CHALLENGE_TYPES.TURNSTILE) {
    await challenge.solveTurnstile(page, { timeout: 30000 });
  }

  await challenge.waitForClearance(page, { timeout: 45000 });

  console.log('Clearance obtained');
  await human.screenshot('/tmp/turnstile-cleared.png');
  await browser.close();
})();
