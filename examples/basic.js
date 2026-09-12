const ccid = require('ccid-browser');

(async () => {
  const { browser, page, human } = await ccid.launch({
    headless: 'new',
    stealth: true,
    profile: 'windows-chrome',
  });

  await page.goto('https://example.com', { waitUntil: 'networkidle2' });

  const title = await page.title();
  console.log('Title:', title);

  await human.screenshot('/tmp/basic.png', { fullPage: true });
  await browser.close();
})();
