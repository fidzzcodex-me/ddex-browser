# ddex-browser v3

Maximum-bypass browser automation. Passes Cloudflare, DataDome, PerimeterX, Akamai.

Built on `rebrowser-puppeteer-core` — the only open-source puppeteer fork that patches the CDP `Runtime.enable` leak, which is the #1 detection vector for every major anti-bot system.

## Installation

```bash
npm install ddex-browser
```

Install Chrome/Chromium first. Set `chromePath` if not at `/usr/bin/google-chrome`.

## Quick Start

```js
const ccid = require('ddex-browser');

const { browser, page, human, challenge } = await ccid.launch({
  headless: false,
  stealth: true,
  turnstile: true,
  profile: 'windows-chrome',
  logLevel: 'info',
  onChallenge: (type) => console.log('Challenge:', type),
});

await page.goto('https://nowsecure.nl');
await human.scrollAndRead(3000);
await challenge.waitForClearance(page, { timeout: 45000 });
await human.screenshot('/tmp/result.png');
await browser.close();
```

## Engine Priority

ddex-browser tries `rebrowser-puppeteer-core` first, falls back to `puppeteer-core`.

| Engine | Runtime.enable Patch | Bypass Rate |
|--------|---------------------|-------------|
| rebrowser-puppeteer-core | ✓ ACTIVE | High |
| puppeteer-core fallback | ✗ INACTIVE | Reduced |

Install rebrowser explicitly for best results:
```bash
npm install rebrowser-puppeteer-core
```

## Launch Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headless` | bool / 'new' | 'new' | Headless mode |
| `stealth` | bool | true | All stealth patches |
| `humanize` | bool | true | Human behavior layer |
| `turnstile` | bool | false | Auto-solve Turnstile in background |
| `profile` | string | 'windows-chrome' | Device fingerprint profile |
| `fingerprint` | object | {} | Override profile fields |
| `proxy` | object / array | null | Proxy config or list for rotation |
| `chromePath` | string | /usr/bin/google-chrome | Chrome executable |
| `userDataDir` | string | null | Persistent session dir |
| `viewport` | object | 1280×800 | Window size |
| `userAgent` | string | profile | Override UA |
| `locale` | string | profile | Browser locale |
| `timezone` | string | profile | Timezone |
| `geolocation` | object | null | GPS coords |
| `timeout` | number | 30000 | Global timeout ms |
| `logLevel` | string/number | 0 | silent/error/warn/info/debug |
| `onChallenge` | function | null | Called on challenge detect |
| `runtimeFixMode` | string | 'addBinding' | rebrowser patch mode |

## Profiles

- `windows-chrome` — Windows 10, Chrome 131, Intel UHD 630, ANGLE D3D11
- `macos-chrome` — macOS 10.15.7, Chrome 131, Apple M1, ANGLE Metal
- `linux-chrome` — Linux x86_64, Chrome 131, Mesa Intel UHD, ANGLE GL 4.6

## Human API

```js
await human.moveMouse(x, y);          // Bézier + easing + overshoot
await human.click('#sel');            // Natural mouse path + hold timing
await human.doubleClick('#sel');
await human.rightClick('#sel');
await human.hover('#sel');
await human.type('#sel', 'text');     // Gaussian + bigram timing + typos
await human.press('Enter');
await human.hotkey('Control', 'a');
await human.select('#sel', 'value');
await human.dragAndDrop('#from','#to');
await human.scroll(400);
await human.scrollAndRead(5000);
await human.idle(2000);               // Micro-movement
await human.screenshot('/tmp/s.png');
await human.waitForSelector('#sel');
await human.waitForNavigation();
```

## Challenge API

```js
const type = await challenge.detect(page);
// 'turnstile' | 'interstitial' | 'js_detection' | 'managed' | 'none'

await challenge.solveTurnstile(page);
await challenge.solveInterstitial(page);
await challenge.solveJSD(page);
await challenge.solveManaged(page);
await challenge.waitForClearance(page, { timeout: 60000 });
challenge.onChallenge(type => console.log('Challenge:', type));
```

## Session Persistence

```js
const ccid = require('ddex-browser');

// Save
const { page } = await ccid.launch({ userDataDir: './session' });
await ccid.saveCookies(page, './cookies.json');
await ccid.saveStorage(page, './storage.json');

// Restore
await ccid.loadCookies(page, './cookies.json');
await ccid.loadStorage(page, './storage.json');
```

## Proxy Rotation

```js
const { ProxyRotator } = require('ddex-browser');
const r = new ProxyRotator([
  { host: '1.1.1.1', port: 8080, username: 'u', password: 'p' },
  { host: '2.2.2.2', port: 8080 },
]);

for (let i = 0; i < 3; i++) {
  const { browser } = await ccid.launch({ proxy: r.next() });
  // ...
  await browser.close();
}
```

## Anti-Detection Checklist

1. `rebrowser-puppeteer-core` — CDP Runtime.enable leak patched
2. `webdriver = undefined` — navigator.webdriver removed
3. Chrome runtime stubs — chrome.app/csi/loadTimes present
4. Plugins/MimeTypes — 3 PDF plugins with iterators
5. userAgentData — full UACH API with getHighEntropyValues
6. WebGL — ANGLE vendor/renderer strings, no SwiftShader
7. WebRTC — STUN leak blocked, CDP disable attempted
8. Battery — realistic charging state
9. Permissions — full state map, PermissionStatus prototype
10. Media devices — platform-specific device list
11. isTrusted = true — on MouseEvent, KeyboardEvent, PointerEvent
12. Error.stack — pptr paths filtered
13. Function.toString — native code masking
14. Intl timezone — DateTimeFormat patched
15. screen dimensions — per profile
16. connection object — realistic 4G NetworkInformation
17. Object.getOwnPropertyDescriptor — webdriver hidden
18. performance.now — sub-millisecond noise
19. Headers — sec-ch-ua-arch, sec-ch-ua-bitness, full-version-list
20. Human behavior — Bézier mouse, bigram keyboard, Gaussian scroll

## License

MIT
