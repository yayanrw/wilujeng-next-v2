import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // To mock 'server-only' which is used by next.js
    setupFiles: ['./vitest.setup.ts'],
  },
});
