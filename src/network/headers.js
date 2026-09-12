const CHROME_HEADER_ORDER = [
  'host', 'connection', 'pragma', 'cache-control',
  'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
  'upgrade-insecure-requests', 'user-agent', 'accept',
  'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-user', 'sec-fetch-dest',
  'referer', 'accept-encoding', 'accept-language', 'cookie',
];

function buildNaturalHeaders(profile) {
  const platform = profile.platform === 'Win32' ? '"Windows"'
    : profile.platform === 'MacIntel' ? '"macOS"'
    : '"Linux"';

  return {
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': platform,
    'sec-ch-ua-platform-version': platform === '"Windows"' ? '"15.0.0"' : platform === '"macOS"' ? '"14.0.0"' : '"6.5.0"',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-full-version-list': '"Google Chrome";v="131.0.6778.204", "Chromium";v="131.0.6778.204", "Not_A Brand";v="24.0.0.0"',
    'upgrade-insecure-requests': '1',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': `${profile.locale || 'en-US'},en;q=0.9`,
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
  };
}

function sortHeadersNatural(headers) {
  const ordered = {};
  for (const key of CHROME_HEADER_ORDER) {
    if (headers[key] !== undefined) ordered[key] = headers[key];
  }
  for (const key of Object.keys(headers)) {
    if (ordered[key] === undefined) ordered[key] = headers[key];
  }
  return ordered;
}

module.exports = { buildNaturalHeaders, sortHeadersNatural, CHROME_HEADER_ORDER };
