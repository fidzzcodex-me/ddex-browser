const ccid = require('ccid-browser');

(async () => {
  const { browser, page, human } = await ccid.launch({
    headless: false,
    stealth: true,
    humanize: true,
    profile: 'windows-chrome',
  });

  await page.goto('https://example.com', { waitUntil: 'networkidle2' });

  await human.scrollAndRead(5000);
  await human.idle(2000);
  await human.moveMouse(400, 300);
  await human.screenshot('/tmp/human-like.png');

  await browser.close();
})();
