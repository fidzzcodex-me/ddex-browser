const logger = require('../utils/logger');

async function disableWebRTCLeak(page) {
  const client = await page.target().createCDPSession().catch(() => null);
  if (!client) return;

  try {
    await client.send('WebRTC.setWebRTCEnabled', { enabled: false });
    logger.debug('WebRTC disabled via CDP');
  } catch {
    logger.debug('CDP WebRTC disable not available — patch-based fallback active');
  }
}

module.exports = { disableWebRTCLeak };
