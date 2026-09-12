const ccid = require('ccid-browser');

(async () => {
  const { browser, page, human, challenge } = await ccid.launch({
    headless: false,
    stealth: true,
    profile: 'windows-chrome',
  });

  await page.goto('https://cloudflare-protected-site.com', { waitUntil: 'domcontentloaded' });

  await challenge.solveInterstitial(page, { timeout: 45000 });
  await challenge.waitForClearance(page, { timeout: 60000 });

  console.log('Interstitial cleared — final URL:', page.url());
  await human.screenshot('/tmp/interstitial-cleared.png');
  await browser.close();
})();
