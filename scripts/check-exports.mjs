#!/usr/bin/env node
// Consumer-shaped smoke check for the `exports` map in package.json.
//
// Subpath patterns are substituted literally: there is no extension probing and no
// directory-index lookup. Bundlers hide that (webpack applies `resolve.extensions` and
// `mainFiles` *after* the exports mapping), so a broken map only surfaces in Node and in
// TypeScript once a consumer moves to `moduleResolution: bundler`/`node16`.
//
// This script therefore checks resolution the way those two resolvers do:
//   1. every public subpath resolves through Node's ESM resolver to a file that exists,
//   2. every element directory is reachable by its bare specifier, with its stylesheet
//      exposed under the `sass`/`style` conditions,
//   3. `tsc --noEmit` passes on a fixture that imports all of them.
//
// Run with `yarn test:exports` (requires `NODE_ENV=production yarn build:js` first).

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
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

// Node only resolves a package by name from a `node_modules` directory, so link the package
// into its own tree. `node_modules` is gitignored, and the link is reused across runs.
function linkSelf() {
  const linkPath = path.join(rootDir, 'node_modules', pkg.name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });

  if (fs.existsSync(linkPath)) {
    if (fs.realpathSync(linkPath) === fs.realpathSync(rootDir)) return;
    fs.rmSync(linkPath, { recursive: true, force: true });
  }

  fs.symlinkSync(rootDir, linkPath, 'junction');
}

function resolvesToFile(specifier) {
  const resolved = import.meta.resolve(specifier);
  const filePath = fileURLToPath(resolved);
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

linkSelf();

// 1. Runtime resolution through Node's ESM resolver.
const elementDirs = fs
  .readdirSync(path.join(distDir, 'elements'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const flatModules = ['hooks', 'helpers'].flatMap((group) =>
  fs
    .readdirSync(path.join(distDir, group))
    .filter((file) => file.endsWith('.js'))
    .map((file) => [group, path.basename(file, '.js')])
);

const specifiers = [
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
  // Stylesheets are addressed with their extension.
  ...fs.readdirSync(path.join(distDir, 'styles')).map((file) => subpath('dist', 'styles', file)),
];

for (const specifier of specifiers) {
  check(`node: ${specifier}`, () => resolvesToFile(specifier));
}

// 2. Types and stylesheet conditions declared for every element directory.
for (const name of elementDirs) {
  const key = `./dist/elements/${name}`;

  check(`exports["${key}"]`, () => {
    const entry = pkg.exports[key];
    assert.ok(entry, `missing. Element directories need an exact key: patterns cannot add /index`);
    assert.equal(entry.types, `${key}/index.d.ts`);
    assert.equal(entry.default, `${key}/index.js`);

    if (fs.existsSync(path.join(rootDir, key, 'index.scss'))) {
      assert.equal(entry.sass, `${key}/index.scss`, 'stylesheet not exposed under the `sass` condition');
      assert.equal(entry.style, `${key}/index.scss`, 'stylesheet not exposed under the `style` condition');
    }
  });
}

// Types must resolve alongside every runtime file, otherwise `tsc` reports TS2307 even
// though Node is happy.
for (const specifier of specifiers.filter((value) => !value.endsWith('.scss'))) {
  check(`types: ${specifier}`, () => {
    const filePath = resolvesToFile(specifier);
    const types = filePath.replace(/\.js$/, '.d.ts');
    assert.ok(fs.existsSync(types), `no declaration file next to ${path.relative(rootDir, filePath)}`);
  });
}

// 3. A consumer type-checking under both exports-aware resolution modes.
const fixture = path.join(rootDir, 'scripts', 'exports-fixture', 'tsconfig.json');
const tscBin = path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');

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

console.log(`✓ ${specifiers.length} subpaths resolve in Node and type-check under moduleResolution bundler/node16`);
