const logger = require('./logger');

function buildProxyArg(proxy) {
  if (!proxy) return null;

  const { host, port, protocol = 'http' } = proxy;

  if (!host || !port) {
    logger.warn('Proxy config missing host or port');
    return null;
  }

  return `--proxy-server=${protocol}://${host}:${port}`;
}

async function applyProxyAuth(page, proxy) {
  if (!proxy || (!proxy.username && !proxy.password)) return;

  await page.authenticate({
    username: proxy.username || '',
    password: proxy.password || '',
  });

  logger.debug('Proxy authentication applied');
}

function validateProxy(proxy) {
  if (!proxy) return true;

  const { host, port } = proxy;

  if (typeof host !== 'string' || host.trim() === '') {
    throw new Error('Proxy host must be a non-empty string');
  }

  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error('Proxy port must be a number between 1 and 65535');
  }

  return true;
}

module.exports = { buildProxyArg, applyProxyAuth, validateProxy };
