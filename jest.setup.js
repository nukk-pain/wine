import '@testing-library/jest-dom'

// Google Cloud Vision API를 위한 Node.js polyfill
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
  global.clearImmediate = (id) => {
    return clearTimeout(id);
  };
}

// FormData 및 기타 Web APIs를 위한 polyfill
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Fetch polyfill for Node.js environment
// Note: node-fetch v3 is ESM only, so we skip the polyfill
// The @google/generative-ai library should handle this internally