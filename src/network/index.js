const { buildProxyArg, applyProxyAuth, validateProxy, ProxyRotator } = require('./proxy');
const { buildNaturalHeaders, sortHeadersNatural } = require('./headers');
const { getTLSNote, applyTLSInterception } = require('./tls');
const { disableWebRTCLeak } = require('./webrtc');
const logger = require('../utils/logger');

class NetworkLayer {
  constructor(page, profile, options = {}) {
    this.page = page;
    this.profile = profile;
    this.options = options;
    this._rotator = null;
  }

  async apply() {
    const headers = buildNaturalHeaders(this.profile);
    await this.page.setExtraHTTPHeaders(headers);

    if (this.options.proxy && Array.isArray(this.options.proxy)) {
      this._rotator = new ProxyRotator(this.options.proxy);
      const first = this._rotator.next();
      if (first) await applyProxyAuth(this.page, first);
    } else if (this.options.proxy) {
      await applyProxyAuth(this.page, this.options.proxy);
    }

    await disableWebRTCLeak(this.page);
    getTLSNote();

    logger.debug('Network layer applied');
  }

  getRotator() {
    return this._rotator;
  }
}

module.exports = { NetworkLayer, ProxyRotator, buildProxyArg, validateProxy };
