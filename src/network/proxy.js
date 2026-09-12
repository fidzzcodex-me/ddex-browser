const logger = require('../utils/logger');

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
    throw new Error('Proxy port must be 1–65535');
  }
  return true;
}

class ProxyRotator {
  constructor(proxyList = []) {
    this._list = proxyList;
    this._index = 0;
  }

  next() {
    if (this._list.length === 0) return null;
    const proxy = this._list[this._index % this._list.length];
    this._index++;
    return proxy;
  }

  current() {
    if (this._list.length === 0) return null;
    return this._list[(this._index - 1) % this._list.length];
  }

  reset() {
    this._index = 0;
  }
}

module.exports = { buildProxyArg, applyProxyAuth, validateProxy, ProxyRotator };
