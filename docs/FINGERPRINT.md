# Fingerprint Guide — ccid-browser v2

## Why Fingerprinting Works

Anti-bot systems correlate dozens of browser signals into a "device profile." Any inconsistency between signals raises the risk score.

The most common failure: developer patches `navigator.webdriver` but leaves WebGL returning SwiftShader (headless-only renderer). The combined signal is detected even if each individual patch looks clean.

## Consistency Rules

### Rule 1: UA ↔ Platform ↔ WebGL must align

| Platform | Expected UA fragment | Expected WebGL Vendor |
|----------|---------------------|----------------------|
| Win32 | Windows NT 10.0 | Intel/NVIDIA/AMD/Google Inc. (Intel) |
| MacIntel | Macintosh; Intel Mac OS X | Apple/Google Inc. (Apple) |
| Linux x86_64 | X11; Linux x86_64 | Mesa/Google Inc. (Intel) |

### Rule 2: Screen dimensions must be natural

- 1920×1080 at DPR 1 (most common Windows)
- 1440×900 or 1512×982 at DPR 2 (MacBook)
- 1280×800 at DPR 1 (Linux)
- Avoid: 800×600, 1024×768 (VM/headless defaults)

### Rule 3: Hardware must match device class

| Device | hardwareConcurrency | deviceMemory |
|--------|-------------------|--------------|
| Budget laptop | 4 | 4 |
| Mid-range | 8 | 8 |
| Workstation | 12-16 | 8 |
| Never | 1 or 3 | 1 (phone) |

### Rule 4: Languages must match timezone

- `en-US` → `America/New_York` or `America/Los_Angeles`
- `en-GB` → `Europe/London`
- `de-DE` → `Europe/Berlin`

## Custom Fingerprint

Override any profile field via `fingerprint` option:

```js
await ccid.launch({
  profile: 'windows-chrome',
  fingerprint: {
    hardwareConcurrency: 12,
    deviceMemory: 8,
    screenWidth: 2560,
    screenHeight: 1440,
    pixelRatio: 2,
    timezone: 'America/Chicago',
    locale: 'en-US',
    webglVendor: 'NVIDIA Corporation',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080, OpenGL 4.6.0)',
  },
});
```

Run `examples/fingerprint-consistency.js` to validate your profile against bot.sannysoft.com.

## What Makes a Profile "Safe"

1. All signals internally consistent
2. Matches a real device model that exists in the wild
3. Not a known VM or cloud instance pattern
4. Has a realistic browsing history (use `userDataDir` for persistence)
5. Paired with a residential IP (datacenter IPs are flagged regardless of fingerprint)

## The One Thing That Beats Fingerprinting

Persistent `userDataDir` + residential proxy + realistic session history. A browser that has visited 50 real sites, has real cookies, and comes from a residential IP will pass most bot checks before fingerprint analysis even runs.

```js
await ccid.launch({
  userDataDir: './profiles/session-001',
  proxy: { host: 'residential.proxy.com', port: 8080 },
});
```
