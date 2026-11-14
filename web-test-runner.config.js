import { fileURLToPath } from 'node:url';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  rootDir: '.',
  files: ['./src/**/*.test.ts'],
  // Read by `yarn test:coverage`. Only Chromium reports coverage, so the report covers the Chromium run.
  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.test.ts'],
    reporters: ['text', 'lcov'],
  },
  concurrentBrowsers: 3,
  testFramework: {
    config: {
      // A real key press (`sendKeys`) goes to the browser and back. While three browsers run at once, one press can
      // take seconds in Firefox, so tests that press keys ran past mocha's 2 seconds there. A test that times out goes
      // on pressing its keys, which then land in the test after it: the longer timeout makes that rare, not impossible.
      timeout: 10000,
    },
  },
  nodeResolve: true,
  preserveSymlinks: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  plugins: [
    // Source files import each other through the `src/...` prefix, which tsconfig's `baseUrl` resolves for the
    // compiler and `@rollup/plugin-typescript` resolves for the build. The dev server needs it spelled out.
    {
      name: 'resolve-src-prefix',
      resolveImport({ source }) {
        if (!source.startsWith('src/')) return;
        return `/${source}.ts`;
      },
    },
    // esbuild only applies `experimentalDecorators` and `useDefineForClassFields: false` when it reads the tsconfig.
    esbuildPlugin({ ts: true, target: 'auto', tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)) }),
  ],
};
