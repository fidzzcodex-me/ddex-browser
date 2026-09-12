# Cloudflare Challenges — Deep Dive

## How Cloudflare Detects Automation

### 1. CDP Runtime.enable Leak
The single most detectable signal. Puppeteer's default behavior calls `Runtime.enable` over the CDP connection, which Cloudflare detects via timing side-channels and JS probe injection. ccid-browser disables this entirely and replaces it with `addBinding`-based context ID resolution.

### 2. navigator.webdriver
Set to `true` by default in all Chromium automation. ccid-browser patches this to `undefined` via `evaluateOnNewDocument`.

### 3. sourceURL in evaluate()
Puppeteer injects `//# sourceURL=pptr:internal/...` in every `page.evaluate()` call. Cloudflare scans script sources. ccid-browser patches the sourceURL to a benign generic name.

### 4. Utility World Name
Default: `__puppeteer_utility_world__`. Renamed to `__util_ctx__`.

### 5. Chrome Object Absence
Real Chrome has `window.chrome.runtime`, `window.chrome.app`, `window.chrome.loadTimes`. Headless Chromium often lacks these. ccid-browser injects realistic stubs.

### 6. Plugin/MimeType Arrays
Real Chrome has 3 plugins and corresponding MIME types. Headless has 0. ccid-browser injects a realistic set.

### 7. WebGL Vendor/Renderer
Headless often exposes SwiftShader or generic Mesa. ccid-browser spoofs to match the selected device profile.

### 8. Function.prototype.toString
Patched functions can be detected via `toString()`. ccid-browser proxies this to return `[native code]` for modified functions.

---

## Challenge Types

### Turnstile
Embedded widget in a page. ccid-browser:
1. Detects the iframe via `challenges.cloudflare.com` src
2. Accesses the iframe frame context
3. Clicks the checkbox with randomized natural timing
4. Waits for challenge resolution

### Interstitial (Managed / Interactive)
Full-page challenge before reaching target. ccid-browser:
1. Detects challenge text patterns in page content
2. Polls every 1.5s
3. If interactive checkbox found, clicks it with natural timing
4. Confirms clearance via cookie

### JavaScript Detection
Silent probe. ccid-browser:
1. Detects title/element patterns
2. Waits for native JS challenge resolution
3. All detections are circumvented at the patch layer (CDP, navigator, WebGL)

---

## Bypass Priority Order

1. CDP Runtime.enable patch (prevents detection before page loads)
2. Navigator hardening (webdriver, plugins, chrome object)
3. WebGL spoofing (matches device profile)
4. Fingerprint consistency (UA ↔ platform ↔ WebGL)
5. Human behavior (mouse, typing, scroll)
6. Challenge auto-solve (last resort — if all else fails)
