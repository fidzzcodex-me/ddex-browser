const ccid = require('ccid-browser');
const path = require('path');

(async () => {
  const { browser, page, human, challenge } = await ccid.launch({
    headless: false,
    stealth: true,
    humanize: true,
    profile: 'windows-chrome',
    onChallenge: (type) => console.log('[ccid] Challenge:', type),
  });

  const cookiePath = path.join(__dirname, '../.session-cookies.json');

  try {
    await ccid.loadCookies(page, cookiePath);
    console.log('Session cookies loaded');
  } catch {
    console.log('No saved session — fresh login');
  }

  await page.goto('https://example.com/login', { waitUntil: 'networkidle2' });

  const type = await challenge.detect(page);
  if (type !== ccid.CHALLENGE_TYPES.NONE) {
    await challenge.waitForClearance(page, { timeout: 45000 });
  }

  await human.scrollAndRead(1500);
  await human.type('#email', 'user@example.com', { clearFirst: true });
  await human.type('#password', 'supersecret123', { clearFirst: true });
  await human.idle(800);
  await human.click('#login-button');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

  await ccid.saveCookies(page, cookiePath);
  console.log('Session saved to', cookiePath);

  await human.screenshot('/tmp/logged-in.png');
  await browser.close();
})();
