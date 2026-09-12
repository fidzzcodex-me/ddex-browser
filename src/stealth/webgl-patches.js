async function applyWebGLPatches(page, profile) {
  await page.evaluateOnNewDocument((p) => {
    const patchCtx = (proto) => {
      const origGetParam = proto.getParameter;
      proto.getParameter = function(parameter) {
        if (parameter === 37446) return p.webglRenderer;
        if (parameter === 37445) return p.webglVendor;
        if (parameter === 7937) return p.webglVendor;
        if (parameter === 7936) return p.webglRenderer;
        return origGetParam.call(this, parameter);
      };

      const origGetExt = proto.getExtension;
      proto.getExtension = function(name) {
        const ext = origGetExt.call(this, name);
        if (name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_VENDOR_WEBGL: 37445,
            UNMASKED_RENDERER_WEBGL: 37446,
          };
        }
        return ext;
      };

      const origGetShaderPrecision = proto.getShaderPrecisionFormat;
      if (origGetShaderPrecision) {
        proto.getShaderPrecisionFormat = function(shaderType, precisionType) {
          const result = origGetShaderPrecision.call(this, shaderType, precisionType);
          if (!result) return result;
          const noiseOffset = precisionType === 35680 ? 0 : (Math.random() > 0.5 ? 1 : 0);
          return {
            rangeMin: result.rangeMin,
            rangeMax: result.rangeMax,
            precision: Math.max(0, result.precision - noiseOffset),
          };
        };
      }

      const origGetSupportedExtensions = proto.getSupportedExtensions;
      if (origGetSupportedExtensions) {
        proto.getSupportedExtensions = function() {
          const exts = origGetSupportedExtensions.call(this) || [];
          if (!exts.includes('WEBGL_debug_renderer_info')) {
            return [...exts, 'WEBGL_debug_renderer_info'];
          }
          return exts;
        };
      }
    };

    patchCtx(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) {
      patchCtx(WebGL2RenderingContext.prototype);
    }

    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attrs) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        const mergedAttrs = Object.assign({
          antialias: true,
          depth: true,
          stencil: false,
          alpha: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }, attrs || {});
        return origGetContext.call(this, type, mergedAttrs);
      }
      return origGetContext.call(this, type, attrs);
    };

  }, profile);
}

module.exports = { applyWebGLPatches };
