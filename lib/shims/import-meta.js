// Shim for import.meta in environments that don't support it
// This is needed for packages like OpenAI SDK that use import.meta.url

if (typeof globalThis !== 'undefined' && !globalThis.importMeta) {
  globalThis.importMeta = {
    url: 'file:///app/',
    env: process.env || {},
  };
}

// Polyfill for environments without import.meta support
if (typeof global !== 'undefined') {
  global.importMeta = global.importMeta || {
    url: 'file:///app/',
    env: {},
  };
}

export default {};
