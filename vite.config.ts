import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      strict: false,
    }
  },

  build: {
    target: 'node22', // or your Node version
    rollupOptions: {
      external: [
        'node:events',
        'node:net',
        'node:http',
        'node:path',
        'node:fs',
        'querystring',
        'string_decoder',
        'buffer',
        'stream',
        'util',
        'fs',
        'path',
      ],
    }
  },
  resolve: {
    conditions: ['angular'],
  },


  appType: 'spa', // 👈 Enables deep link fallback
});