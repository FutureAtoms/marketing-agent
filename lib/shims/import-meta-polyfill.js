// Polyfill for import.meta for environments that don't support it
// This must be loaded before any code that uses import.meta

if (typeof globalThis !== 'undefined' && typeof import === 'undefined') {
  // Create a mock import.meta object for Metro bundler
  Object.defineProperty(globalThis, 'import', {
    value: {
      meta: {
        env: {
          MODE: process.env.NODE_ENV || 'development',
          DEV: process.env.NODE_ENV !== 'production',
          PROD: process.env.NODE_ENV === 'production',
        },
        url: '',
      },
    },
    writable: false,
    configurable: false,
  });
}
