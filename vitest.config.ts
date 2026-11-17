import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Source files import each other through the `src/...` prefix, which tsconfig's `paths` resolves for the compiler.
    alias: [{ find: /^src\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }],
  },
  test: {
    include: ['src/**/*.test.ts'],
    // `@ambiki/impulse/testing` registers `cleanup()` with a global `afterEach`.
    globals: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
    // Read by `yarn test:coverage`, which runs Chromium only: V8 coverage is Chromium's.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/internal/test_*.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
