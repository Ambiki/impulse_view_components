#!/usr/bin/env node
// Consumer-shaped smoke check for the `exports` map in package.json.
//
// Subpath patterns are substituted literally: there is no extension probing and no
// directory-index lookup. Bundlers hide that (webpack applies `resolve.extensions` and
// `mainFiles` *after* the exports mapping), so a broken map only surfaces in Node and in
// TypeScript once a consumer moves to `moduleResolution: bundler`/`node16`.
//
// This script therefore checks resolution the way those resolvers do:
//   1. every public subpath resolves through Node's ESM resolver to a file that exists,
//   2. element stylesheets resolve under the `sass`/`style` conditions, which is how
//      sass-loader asks for them,
//   3. a declaration file sits next to every runtime file,
//   4. every import in a declaration file resolves for consumers: none goes through the
//      repo-only `src/` path alias, and every relative one names an emitted declaration with
//      the `.js` extension `node16` needs,
//   5. `tsc --noEmit` passes on a fixture that imports all of them and asserts that the types
//      it reads aren't `any`, with library checks on under `bundler`,
//   6. a bundler keeps what an app imports and drops the rest: one hook doesn't bring the
//      others, and importing an element keeps its registration,
//   7. the stylesheets compile the way the docs import them, through Dart Sass's `pkg:`
//      importer, and they and the precompiled CSS define every custom property they read.
//
// Resolution works without linking the package into `node_modules`: a package with an
// `exports` map can reference itself by name, and both this script and the fixture live
// inside it.
//
// Run with `yarn test:exports` (requires `yarn build:prod` first).

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import * as sass from 'sass';
import { declarationSpecifiers, SOURCE_ALIAS } from './rewrite-declaration-imports.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const distDir = path.join(rootDir, 'dist');
const failures = [];

function check(description, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${description}\n    ${error.message.split('\n').join('\n    ')}`);
  }
}

function resolvesToFile(specifier) {
  const filePath = fileURLToPath(import.meta.resolve(specifier));
  assert.ok(fs.existsSync(filePath), `resolved to ${path.relative(rootDir, filePath)}, which does not exist`);
  return filePath;
}

// `import.meta.resolve` cannot be given custom conditions, so resolve in a child process
// that was started with them.
function resolvesToFileUnder(conditions, specifier) {
  const script = `process.stdout.write(import.meta.resolve(${JSON.stringify(specifier)}))`;
  const args = [...conditions.flatMap((condition) => ['--conditions', condition]), '--input-type=module', '-e', script];
  const result = spawnSync(process.execPath, args, { cwd: rootDir, encoding: 'utf8' });

  assert.equal(result.status, 0, `did not resolve\n${(result.stderr || '').trim()}`);

  const filePath = fileURLToPath(result.stdout.trim());
  assert.ok(fs.existsSync(filePath), `resolved to ${path.relative(rootDir, filePath)}, which does not exist`);
  return filePath;
}

function subpath(...segments) {
  return [pkg.name, ...segments].join('/');
}

// Stylesheets are only copied into dist/ by the production build, and the precompiled CSS only by the CSS build. Both
// are part of the published surface, so the check needs the full production build.
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'styles')) || !fs.existsSync(path.join(distDir, 'styles.css'))) {
  console.error('dist/ is missing or incomplete. Run `yarn build:prod` before `yarn test:exports`.');
  process.exit(1);
}

const elementDirs = fs
  .readdirSync(path.join(distDir, 'elements'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const styledElementDirs = elementDirs.filter((name) =>
  fs.existsSync(path.join(distDir, 'elements', name, 'index.scss')),
);

const flatModules = ['hooks', 'helpers'].flatMap((group) =>
  fs
    .readdirSync(path.join(distDir, group))
    .filter((file) => file.endsWith('.js') && file !== 'index.js')
    .map((file) => [group, path.basename(file, '.js')]),
);

// The import paths the docs teach (ADR 0008).
const publicSpecifiers = [
  ...elementDirs.map((name) => subpath(name)),
  subpath('hooks'),
];

// 1. Runtime resolution through Node's ESM resolver. The `dist/` paths are deprecated, but apps
// still import them.
const scriptSpecifiers = [
  ...publicSpecifiers,
  pkg.name,
  subpath('dist', 'index.js'),
  ...elementDirs.map((name) => subpath('dist', 'elements', name)),
  ...elementDirs.map((name) => subpath('dist', 'elements', name, 'index.js')),
  ...flatModules.map(([group, name]) => subpath('dist', group, name)),
  ...flatModules.map(([group, name]) => subpath('dist', group, `${name}.js`)),
  // Non-index modules inside an element directory.
  ...fs
    .readdirSync(path.join(distDir, 'elements', 'autocomplete'))
    .filter((file) => file.endsWith('.js') && file !== 'index.js')
    .map((file) => subpath('dist', 'elements', 'autocomplete', path.basename(file, '.js'))),
];

// Stylesheets addressed with their extension, which needs no condition.
const styleSpecifiers = [
  ...styledElementDirs.map((name) => subpath('dist', 'elements', name, 'index.scss')),
  ...fs
    .readdirSync(path.join(distDir, 'styles'))
    .filter((file) => file !== 'index.scss')
    .map((file) => subpath('dist', 'styles', file)),
];

for (const specifier of [...scriptSpecifiers, ...styleSpecifiers]) {
  check(`node: ${specifier}`, () => resolvesToFile(specifier));
}

// The entry files behind the new paths stay off the `dist/` wildcards, which are frozen: anything they reach can never
// change again.
for (const specifier of [
  subpath('dist', 'hooks', 'index'),
  subpath('dist', 'hooks', 'index.js'),
  subpath('dist', 'styles', 'index.scss'),
]) {
  check(`node: ${specifier} is not exported`, () => {
    assert.throws(() => import.meta.resolve(specifier), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
  });
}

// 2. Element stylesheets under the conditions sass-loader resolves with. Without them the
// bare specifier lands on the element's JavaScript, and sass-loader reports the subpath as
// missing rather than falling back.
for (const name of styledElementDirs) {
  const specifier = subpath('dist', 'elements', name);
  const stylesheet = path.join(distDir, 'elements', name, 'index.scss');

  for (const condition of ['sass', 'style']) {
    check(`node --conditions ${condition}: ${specifier}`, () => {
      assert.equal(resolvesToFileUnder([condition], specifier), stylesheet);
    });
  }
}

// The paths the docs teach follow the conditions' convention: `sass` names Sass and `style` names CSS. An element has
// no CSS of its own, so its path has no `style`, and a CSS tool doesn't get Sass it can't parse.
for (const name of styledElementDirs) {
  const specifier = subpath(name);
  const stylesheet = path.join(distDir, 'elements', name, 'index.scss');

  check(`node --conditions sass: ${specifier}`, () => {
    assert.equal(resolvesToFileUnder(['sass'], specifier), stylesheet);
  });
  check(`node --conditions style: ${specifier}`, () => {
    assert.notEqual(resolvesToFileUnder(['style'], specifier), stylesheet, 'a `style` condition names Sass');
  });
}

// Element directories need an exact key: a pattern cannot append `/index`, so a new element
// silently stops resolving without one.
for (const name of elementDirs) {
  for (const key of [`./${name}`, `./dist/elements/${name}`]) {
    check(`exports["${key}"]`, () => {
      assert.ok(pkg.exports[key], 'missing. Element directories need an exact key, patterns cannot append /index');
    });
  }
}

// 3. Types must resolve alongside every runtime file, otherwise `tsc` reports TS2307 even
// though Node is happy.
for (const specifier of scriptSpecifiers) {
  check(`types: ${specifier}`, () => {
    const filePath = resolvesToFile(specifier);
    const types = filePath.replace(/\.js$/, '.d.ts');
    assert.ok(fs.existsSync(types), `no declaration file next to ${path.relative(rootDir, filePath)}`);
  });
}

// 4. Every import in a declaration must resolve for consumers. An import that doesn't resolve inside a `.d.ts` raises
// no error under `skipLibCheck`, which most apps set, so the types it brings in would silently become `any`. That rules
// out the repo-only `src/*` path alias, and relative imports without the `.js` extension `node16` needs.
// `scripts/rewrite-declaration-imports.mjs` produces such imports; this checks it did.
function declarationFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return declarationFiles(entryPath);
    return entry.name.endsWith('.d.ts') ? [entryPath] : [];
  });
}

for (const file of declarationFiles(distDir)) {
  const specifiers = declarationSpecifiers(fs.readFileSync(file, 'utf8')).map(({ specifier }) => specifier);

  check(`declarations: ${path.relative(rootDir, file)}`, () => {
    const aliased = specifiers.filter((specifier) => specifier.startsWith(SOURCE_ALIAS));
    assert.deepEqual(aliased, [], `imports through the src/ alias: ${aliased.join(', ')}`);

    const unresolved = specifiers
      .filter((specifier) => specifier.startsWith('.'))
      .filter((specifier) => {
        if (!specifier.endsWith('.js')) return true;
        return !fs.existsSync(path.resolve(path.dirname(file), specifier.replace(/\.js$/, '.d.ts')));
      });
    assert.deepEqual(unresolved, [], `relative imports node16 can't resolve: ${unresolved.join(', ')}`);
  });
}

// 5. A consumer type-checking under both exports-aware resolution modes.
const fixture = path.join(rootDir, 'scripts', 'exports-fixture', 'tsconfig.json');
const tscBin = createRequire(import.meta.url).resolve('typescript/bin/tsc');

// Library checks run under `bundler`, so IVC's own declarations (such as the `HTMLElementTagNameMap`
// augmentations) are type-checked as an app would see them. They stay skipped under `node16`
// only because `@ambiki/impulse`'s own declarations use extensionless imports, which `node16`
// can't resolve (Ambiki/impulse#224).
for (const [moduleKind, moduleResolution, skipLibCheck] of [
  ['ESNext', 'bundler', 'false'],
  ['node16', 'node16', 'true'],
]) {
  const args = [
    '--noEmit',
    '-p',
    fixture,
    '--module',
    moduleKind,
    '--moduleResolution',
    moduleResolution,
    '--skipLibCheck',
    skipLibCheck,
  ];
  const tsc = spawnSync(process.execPath, [tscBin, ...args], { cwd: rootDir, encoding: 'utf8' });

  if (tsc.status !== 0) {
    failures.push(`tsc ${args.join(' ')}\n    ${(tsc.stdout || tsc.stderr).trim().split('\n').join('\n    ')}`);
  }
}

// 6. An app's bundle holds what it imports and nothing else. A bundler keeps every module a shared path such as
// `hooks` reaches, along with that module's own imports, unless `sideEffects` in package.json says it can drop the
// unused ones. That must not drop an element's registration, which is all a bare `import '…/popover'` is for.
function bundle(contents) {
  const result = esbuild.buildSync({
    stdin: { contents, resolveDir: rootDir },
    bundle: true,
    write: false,
    format: 'esm',
    external: Object.keys(pkg.dependencies),
    metafile: true,
    logLevel: 'silent',
  });
  const [output] = Object.values(result.metafile.outputs);

  return {
    text: result.outputFiles[0].text,
    modules: Object.entries(output.inputs)
      .filter(([, { bytesInOutput }]) => bytesInOutput > 0)
      .map(([file]) => file),
    imports: output.imports.map((entry) => entry.path),
  };
}

check(`bundle: one hook from ${subpath('hooks')}`, () => {
  const { modules, imports } = bundle(`import { useOutsideClick } from '${subpath('hooks')}'; useOutsideClick;`);
  assert.deepEqual(modules.filter((file) => /use_floating_ui|use_focus_out|positioning/.test(file)), [], 'bundles hooks it does not import');
  assert.ok(!imports.includes('@floating-ui/dom'), 'imports @floating-ui/dom, which only useFloatingUI needs');
});

for (const name of elementDirs) {
  for (const specifier of [subpath(name), subpath('dist', 'elements', name)]) {
    check(`bundle: import '${specifier}'`, () => {
      assert.match(bundle(`import '${specifier}';`).text, new RegExp(`['"]awc-${name}['"]`), 'drops the registration');
    });
  }
}

check(`bundle: import '${pkg.name}'`, () => {
  const { text } = bundle(`import '${pkg.name}';`);
  for (const name of elementDirs) assert.match(text, new RegExp(`['"]awc-${name}['"]`), `drops <awc-${name}>`);
});

// 7. Stylesheets that follow the docs hold each element's rules, and define every custom property they read, other than
// those the elements set at runtime.
const RUNTIME_PROPERTY = /^--awc-auto-size-/;

function assertStyles(css, names) {
  for (const name of names) assert.match(css, new RegExp(`\\.awc-${name}`), `has no .awc-${name} rules`);

  const defined = new Set(css.match(/--[\w-]+(?=\s*:)/g));
  const read = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(([, property]) => property));
  const undefinedProperties = [...read].filter((property) => !defined.has(property) && !RUNTIME_PROPERTY.test(property));
  assert.deepEqual(undefinedProperties, [], 'reads custom properties nothing defines');
}

// The Sass compiles through Dart Sass's own `pkg:` importer, after Bootstrap. The importer only finds packages in a
// `node_modules`, so it compiles from a throwaway app that links this package in.
const sassApp = fs.mkdtempSync(path.join(os.tmpdir(), 'ivc-sass-'));

try {
  fs.mkdirSync(path.join(sassApp, 'node_modules', '@ambiki'), { recursive: true });
  fs.symlinkSync(rootDir, path.join(sassApp, 'node_modules', pkg.name), 'dir');
  fs.symlinkSync(path.join(rootDir, 'node_modules', 'bootstrap'), path.join(sassApp, 'node_modules', 'bootstrap'), 'dir');

  const bootstrapImports = ['functions', 'variables', 'mixins'].map((file) => `@import 'pkg:bootstrap/scss/${file}';`);
  const compile = (specifiers) =>
    sass.compileString([...bootstrapImports, ...specifiers.map((specifier) => `@import 'pkg:${specifier}';`)].join('\n'), {
      importers: [new sass.NodePackageImporter(sassApp)],
      logger: sass.Logger.silent,
    }).css;

  for (const name of styledElementDirs) {
    const specifiers = [subpath('base'), subpath(name)];
    check(`sass: ${specifiers.join(' + ')}`, () => assertStyles(compile(specifiers), [name]));
  }

  check(`sass: ${pkg.name}`, () => assertStyles(compile([pkg.name]), styledElementDirs));
} finally {
  fs.rmSync(sassApp, { recursive: true, force: true });
}

// The precompiled CSS stands alone, so an app without Sass or Bootstrap can use it. CSS tools reach it through the bare
// path's `style` condition.
for (const [conditions, specifier] of [[[], subpath('styles.css')], [['style'], pkg.name]]) {
  check(`css: ${conditions.map((condition) => `--conditions ${condition} `).join('')}${specifier}`, () => {
    const file = resolvesToFileUnder(conditions, specifier);
    assert.ok(file.endsWith('.css'), `resolved to ${path.relative(rootDir, file)}`);

    const css = fs.readFileSync(file, 'utf8');
    assertStyles(css, styledElementDirs);

    const sourceMap = css.match(/sourceMappingURL=(\S+)/)?.[1];
    if (sourceMap && !sourceMap.startsWith('data:')) {
      assert.ok(fs.existsSync(path.resolve(path.dirname(file), sourceMap)), `points at ${sourceMap}, which isn't published`);
    }
  });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} exports check(s) failed:\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}\n`);
  process.exit(1);
}

const total = scriptSpecifiers.length + styleSpecifiers.length;
console.log(`✓ ${total} subpaths resolve in Node, type-check under moduleResolution bundler/node16, bundle what they import, and compile their styles`);
