# Troubleshooting

## Browser launch failed: spawn ENOENT

Chrome/Chromium not found at default path. Set `chromePath` option:

```js
await ccid.launch({ chromePath: '/snap/bin/chromium' });
```

Find your Chrome path: `which google-chrome` or `which chromium-browser`

---

## Still getting blocked by Cloudflare

1. Use `headless: false` + Xvfb on server (best bypass rate)
2. Use a residential proxy — datacenter IPs are flagged regardless of fingerprint
3. Rotate profiles between sessions
4. Enable `logLevel: 4` to debug which patches are applying
5. Check `bot.sannysoft.com` and `browserleaks.com` to verify patches

---

## Xvfb not found

Install on Ubuntu/Debian:
```bash
apt-get install xvfb
```

Then use `headless: false` — ccid-browser auto-detects and starts Xvfb.

---

## Cookie file parse error

The cookie JSON file may be corrupted. Delete it and let ccid-browser create a fresh session.

---

## Turnstile not clicking

Some Turnstile widgets are invisible (non-interactive). The challenge resolves automatically via JavaScript proof-of-work. Use `challenge.waitForClearance()` instead of `challenge.solveTurnstile()` directly — it auto-routes.

---

## Page crashes immediately

- Try reducing `headless` to `false` with Xvfb
- Add `--disable-dev-shm-usage` is already included by default
- On low-memory servers, increase `/dev/shm`: `mount -o remount,size=512M /dev/shm`

---

## TypeError: page.evaluate is not a function

Ensure `puppeteer-core` is installed: `npm install puppeteer-core`

---

## Drop-in replacement for puppeteer-real-browser

Change:
```js
const { connect } = require('puppeteer-real-browser');
const { browser, page } = await connect({ headless: false });
```

To:
```js
const ccid = require('ccid-browser');
const { browser, page, human, challenge } = await ccid.launch({ headless: false });
```

The `page` object is a standard Puppeteer Page — all existing `page.*` calls work unchanged.
