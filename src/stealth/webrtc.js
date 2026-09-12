async function applyWebRTCLeak(page) {
  await page.evaluateOnNewDocument(() => {
    const originalRTCPeerConnection = window.RTCPeerConnection;

    if (!originalRTCPeerConnection) return;

    function PatchedRTCPeerConnection(config, constraints) {
      if (config && config.iceServers) {
        config.iceServers = config.iceServers.filter(server => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
          return !urls.some(url => typeof url === 'string' && url.startsWith('stun:'));
        });
      }

      const pc = new originalRTCPeerConnection(config, constraints);
      const origAddIceCandidate = pc.addIceCandidate.bind(pc);

      pc.addIceCandidate = function(candidate) {
        if (candidate && candidate.candidate) {
          const sdp = candidate.candidate;
          if (sdp.includes('typ srflx') || sdp.includes('typ host')) {
            return Promise.resolve();
          }
        }
        return origAddIceCandidate(candidate);
      };

      return pc;
    }

    PatchedRTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
    PatchedRTCPeerConnection.generateCertificate = originalRTCPeerConnection.generateCertificate;

    window.RTCPeerConnection = PatchedRTCPeerConnection;

    if (window.webkitRTCPeerConnection) {
      window.webkitRTCPeerConnection = PatchedRTCPeerConnection;
    }
  });
}

module.exports = { applyWebRTCLeak };
