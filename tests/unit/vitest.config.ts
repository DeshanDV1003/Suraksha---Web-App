import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    include: ['{backend,frontend}/**/*.{test,spec}.{ts,tsx}'],
    // Route each folder to the right environment
    environmentMatchGlobs: [
      ['frontend/**', 'jsdom'],
      ['backend/**', 'node'],
    ],
  },
  resolve: {
    // One React copy for the whole run (testing-library + any hook under test).
    dedupe: ['react', 'react-dom'],
  },
});
