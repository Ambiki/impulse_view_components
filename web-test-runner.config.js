import { fileURLToPath } from 'node:url';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  rootDir: '.',
  files: ['./src/**/*.test.ts'],
  concurrentBrowsers: 3,
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
