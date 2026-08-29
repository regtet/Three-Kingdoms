import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'assets/scripts/core'),
    },
  },
  esbuild: {
    target: 'node18',
  },
});
