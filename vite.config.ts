import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      strict: false,
    },
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    conditions: ['angular'],
  },

  appType: 'spa', // 👈 Enables deep link fallback
});