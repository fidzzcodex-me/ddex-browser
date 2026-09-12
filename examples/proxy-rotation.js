const ccid = require('ccid-browser');

const PROXY_LIST = [
  { host: '1.2.3.4', port: 8080, username: 'user1', password: 'pass1' },
  { host: '5.6.7.8', port: 8080, username: 'user2', password: 'pass2' },
  { host: '9.10.11.12', port: 8080, username: 'user3', password: 'pass3' },
];

(async () => {
  const rotator = new ccid.ProxyRotator(PROXY_LIST);

  for (let i = 0; i < 3; i++) {
    const proxy = rotator.next();
    console.log(`Session ${i + 1} using proxy: ${proxy.host}:${proxy.port}`);

    const { browser, page, human } = await ccid.launch({
      headless: 'new',
      stealth: true,
      profile: 'windows-chrome',
      proxy,
      logLevel: 'info',
    });

    try {
      await page.goto('https://httpbin.org/ip', { waitUntil: 'networkidle2' });
      const body = await page.evaluate(() => document.body.innerText);
      console.log(`Session ${i + 1} IP response:`, body);
      await human.screenshot(`/tmp/proxy-session-${i + 1}.png`);
    } catch (err) {
      console.error(`Session ${i + 1} error:`, err.message);
    } finally {
      await browser.close();
    }
  }
})();
