# Stealth Architecture — ccid-browser v2

## The #1 Problem: CDP Runtime.enable

Every major anti-bot system (Cloudflare, DataDome, PerimeterX) detects Puppeteer through a single vector: `Runtime.enable` over the Chrome DevTools Protocol.

When Puppeteer calls `Runtime.enable`, it:
1. Changes `Error.stack` behavior in ways detectable from JS
2. Creates CDP objects not present in real Chrome sessions
3. Leaks automation metadata through timing side-channels

### The Fix: addBinding Mode

ccid-browser uses `rebrowser-puppeteer-core` which replaces `Runtime.enable` with:

1. `Runtime.addBinding` — adds a named binding to the page
2. `Page.createIsolatedWorld` — creates an isolated execution context
3. Custom event dispatch to identify the correct context ID

Controlled via:
```
REBROWSER_PATCHES_RUNTIME_FIX_MODE=addBinding  (default)
REBROWSER_PATCHES_SOURCE_URL=app.js            (replaces pptr: sourceURL)
REBROWSER_PATCHES_UTILITY_WORLD_NAME=util      (replaces __puppeteer_utility_world__)
```

---

## All 25 Detection Layers

| Layer | What | Patch |
|-------|------|-------|
| 1 | CDP Runtime.enable | rebrowser-puppeteer-core addBinding mode |
| 2 | sourceURL leak | REBROWSER_PATCHES_SOURCE_URL=app.js |
| 3 | Utility world name | REBROWSER_PATCHES_UTILITY_WORLD_NAME=util |
| 4 | navigator.webdriver | undefined via evaluateOnNewDocument |
| 5 | Chrome runtime | chrome.runtime/app/csi/loadTimes stubs |
| 6 | navigator.plugins | 3 realistic PDF plugins |
| 7 | navigator.mimeTypes | matching MIME entries |
| 8 | navigator.languages | ['en-US', 'en'] |
| 9 | hardwareConcurrency | per profile (4/8/16) |
| 10 | deviceMemory | per profile (4/8) |
| 11 | navigator.userAgentData | full UACH API stub |
| 12 | navigator.connection | realistic 4G connection object |
| 13 | navigator.getBattery() | realistic battery state |
| 14 | navigator.permissions.query | per-permission state map |
| 15 | navigator.mediaDevices | platform-specific device list |
| 16 | WebGL vendor/renderer | per profile, ANGLE strings |
| 17 | Notification.permission | 'default' |
| 18 | Function.prototype.toString | native code masking |
| 19 | Error.stack | pptr path removal |
| 20 | screen dimensions | per profile |
| 21 | window dimensions | outerWidth/Height, screenX/Y |
| 22 | devicePixelRatio | per profile (1/2) |
| 23 | WebRTC leak | RTCPeerConnection STUN filter + CDP disable |
| 24 | Mouse events | screenX/Y natural calculation |
| 25 | CDCx automation vars | deleted on new document |

---

## Fingerprint Profiles

Each profile is a coherent device identity. All fields are cross-consistent.

### windows-chrome
- OS: Windows 11
- Browser: Chrome 131
- GPU: Intel Iris Xe (ANGLE/D3D11)
- Memory: 8GB, 8 cores
- Screen: 1920×1080, DPR 1

### macos-chrome
- OS: macOS 10.15.7 (Catalina)
- Browser: Chrome 131
- GPU: Apple GPU (Metal)
- Memory: 8GB, 8 cores
- Screen: 1440×900, DPR 2

### linux-chrome
- OS: Ubuntu / Linux x86_64
- Browser: Chrome 131
- GPU: Mesa llvmpipe
- Memory: 8GB, 4 cores
- Screen: 1280×800, DPR 1

---

## What ccid-browser Does NOT Do (by design)

- No canvas noise injection — causes subtle artifacts detectable by ML
- No audio fingerprint patching — hardware-specific, patching creates anomalies
- No font enumeration override — font presence depends on real OS install
- No TLS fingerprint override — requires curl-impersonate, noted in tls.js

These omissions are intentional. Wrong patches are worse than no patches.
