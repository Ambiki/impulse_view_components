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
//   4. `tsc --noEmit` passes on a fixture that imports all of them.
//
// Resolution works without linking the package into `node_modules`: a package with an
// `exports` map can reference itself by name, and both this script and the fixture live
// inside it.
//
// Run with `yarn test:exports` (requires `NODE_ENV=production yarn build:js` first).

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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

// Stylesheets are only copied into dist/ by the production build, and they are part of the
// published surface, so the check needs that build rather than the development one.
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'styles'))) {
  console.error('dist/ is missing or incomplete. Run `NODE_ENV=production yarn build:js` before `yarn test:exports`.');
  process.exit(1);
}

const elementDirs = fs
  .readdirSync(path.join(distDir, 'elements'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const styledElementDirs = elementDirs.filter((name) =>
  fs.existsSync(path.join(distDir, 'elements', name, 'index.scss'))
);

const flatModules = ['hooks', 'helpers'].flatMap((group) =>
  fs
    .readdirSync(path.join(distDir, group))
    .filter((file) => file.endsWith('.js'))
    .map((file) => [group, path.basename(file, '.js')])
);

// 1. Runtime resolution through Node's ESM resolver.
const scriptSpecifiers = [
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
  ...fs.readdirSync(path.join(distDir, 'styles')).map((file) => subpath('dist', 'styles', file)),
];

for (const specifier of [...scriptSpecifiers, ...styleSpecifiers]) {
  check(`node: ${specifier}`, () => resolvesToFile(specifier));
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

// Element directories need an exact key: a pattern cannot append `/index`, so a new element
// silently stops resolving without one.
for (const name of elementDirs) {
  const key = `./dist/elements/${name}`;

  check(`exports["${key}"]`, () => {
    assert.ok(pkg.exports[key], 'missing. Element directories need an exact key, patterns cannot append /index');
  });
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

// 4. A consumer type-checking under both exports-aware resolution modes.
const fixture = path.join(rootDir, 'scripts', 'exports-fixture', 'tsconfig.json');
const tscBin = createRequire(import.meta.url).resolve('typescript/bin/tsc');

for (const [moduleKind, moduleResolution] of [
  ['ESNext', 'bundler'],
  ['node16', 'node16'],
]) {
  const args = ['--noEmit', '-p', fixture, '--module', moduleKind, '--moduleResolution', moduleResolution];
  const tsc = spawnSync(process.execPath, [tscBin, ...args], { cwd: rootDir, encoding: 'utf8' });

  if (tsc.status !== 0) {
    failures.push(`tsc ${args.join(' ')}\n    ${(tsc.stdout || tsc.stderr).trim().split('\n').join('\n    ')}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} exports check(s) failed:\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}\n`);
  process.exit(1);
}

const total = scriptSpecifiers.length + styleSpecifiers.length;
console.log(`✓ ${total} subpaths resolve in Node and type-check under moduleResolution bundler/node16`);
