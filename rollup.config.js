import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { copy } from '@web/rollup-plugin-copy';
import { globby } from 'globby';
import { uglify } from 'rollup-plugin-uglify';

const isProd = process.env.NODE_ENV === 'production';

/**
 * @type {import('rollup').RollupOptions}
 */
export default [
  {
    input: [
      './src/index.ts',
      // Need to export these in package.json
      ...(await globby('./src/elements/**/!(*.test).ts')),
      ...(await globby('./src/hooks/**/!(*.test).ts')),
      ...(await globby('./src/helpers/**/!(*.test).ts')),
    ],
    output: [
      {
        dir: 'dist',
        entryFileNames: '[name].js',
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    ],
    external: ['@ambiki/combobox', '@ambiki/impulse', '@floating-ui/dom', 'tabbable'],
    plugins: [
      resolve(),
      typescript({ tsconfig: './tsconfig.prod.json' }),
      ...(isProd
        ? [
            // Copy styles
            copy({
              patterns: '**/*.scss',
              rootDir: './src',
              exclude: ['node_modules', 'index.scss'],
            }),
          ]
        : []),
    ],
  },
  {
    input: 'src/index.ts',
    external: ['@floating-ui/dom'],
    output: [
      {
        name: 'ImpulseViewComponents',
        file: 'app/assets/dist/impulse_view_components.js',
        format: 'umd',
        globals: {
          '@floating-ui/dom': 'FloatingUIDOM',
        },
      },
    ],
    plugins: [
      resolve({ browser: true }),
      typescript({
        compilerOptions: {
          declaration: false, // iife bundles don't need types
          declarationMap: false,
        },
      }),
      ...(isProd ? [uglify()] : []),
    ],
  },
];
