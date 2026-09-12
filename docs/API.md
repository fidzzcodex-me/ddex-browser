# ccid-browser — API Reference

## `ccid.launch(options)` → `{ browser, page, human, challenge, profile }`

Main entry point. Returns a configured Puppeteer browser and all ccid layers.

### Options

See README for full table.

---

## HumanLayer

### `human.moveMouse(x, y)`
Moves the mouse from its current position to (x, y) using a randomized Bézier curve with jitter and overshoot.

### `human.click(selector, options?)`
Moves the mouse to the center of the matched element and performs a natural click (mousedown + mouseup with slight delay).

### `human.type(selector, text, options?)`
Focuses the element and types each character with Gaussian-distributed delays. Optional typo simulation with self-correction.

Options:
- `typos` (bool, default true) — enable random typos
- `clearFirst` (bool, default false) — Ctrl+A + Delete before typing

### `human.scroll(amount, options?)`
Scrolls the page by `amount` pixels using natural acceleration/deceleration.

Options:
- `direction` ('down' | 'up', default 'down')
- `stepMin` (default 80)
- `stepMax` (default 200)

### `human.scrollAndRead(durationMs, options?)`
Scrolls while simulating reading behavior with random pauses and mouse micro-movements.

### `human.idle(durationMs)`
Simulates an idle user with subtle mouse micro-movements.

### `human.press(key, options?)`
Presses a keyboard key with natural pre/post delays.

### `human.waitForSelector(selector, options?)`
Waits for a selector with automatic retry.

Options:
- `timeout` (default 15000ms)
- `retries` (default 3)
- `retryDelay` (default 1000ms)

### `human.screenshot(path, options?)`
Takes a screenshot.

---

## ChallengeHandler

### `challenge.detect(page)` → `CHALLENGE_TYPES`
Inspects page content and DOM to identify the active challenge type.

Returns: `'turnstile' | 'interstitial' | 'js_detection' | 'none'`

### `challenge.solveTurnstile(page, options?)`
Locates the Turnstile iframe and performs a natural click on the widget.

Options:
- `timeout` (default 45000ms)
- `maxAttempts` (default 3)

### `challenge.solveInterstitial(page, options?)`
Waits for a Cloudflare interstitial page to clear, clicking interactive checkboxes if present.

### `challenge.waitForClearance(page, options?)`
Polls for the `cf_clearance` cookie. Internally calls the appropriate solver based on detected challenge type.

### `challenge.onChallenge(callback)`
Registers a callback invoked when a challenge is detected. Receives the challenge type string.

---

## Utilities

### `ccid.saveCookies(page, filePath)`
Saves all current page cookies to a JSON file.

### `ccid.loadCookies(page, filePath)`
Loads cookies from a JSON file and injects them into the page.

---

## Constants

```js
const { LOG_LEVELS, PROFILES, CHALLENGE_TYPES } = require('ccid-browser');
```
