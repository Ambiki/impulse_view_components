// Rollup plugin that makes the import specifiers in emitted declaration files resolvable for
// consumers.
//
// TypeScript copies specifiers into `.d.ts` files exactly as written in the source. The source
// uses the repo-only `src/*` path alias and extensionless relative imports, both of which
// `moduleResolution: bundler` accepts but a consumer can't resolve: nobody else has the alias,
// and `node16`/`nodenext` resolve this ESM package's declarations by Node's rules, which need an
// extension. An import that doesn't resolve inside a `.d.ts` raises no error under
// `skipLibCheck`; the types it brings in silently become `any`.
//
// For every emitted declaration, this rewrites
//   - `src/…` into a path relative to the declaration, and
//   - an extensionless relative specifier into `…/x.js` or `…/x/index.js`, whichever names an
//     emitted declaration.
//
// `scripts/check-exports.mjs` verifies the result.

import path from 'node:path';
import ts from 'typescript';

export const SOURCE_ALIAS = 'src/';

/**
 * The module specifiers a declaration file imports, with their positions in `source`: static
 * imports and exports, bare `import '…'`, and `import('…')` types. Found with TypeScript's own
 * scanner, so text that only looks like an import (in a comment or a string literal type) is
 * left alone.
 */
export function declarationSpecifiers(source) {
  return ts.preProcessFile(source, true, true).importedFiles.map(({ fileName, pos }) => {
    // `pos` points at the opening quote.
    const start = source.indexOf(fileName, pos);
    return { specifier: fileName, start, end: start + fileName.length };
  });
}

export default function rewriteDeclarationImports() {
  return {
    name: 'rewrite-declaration-imports',
    generateBundle(_options, bundle) {
      const declarations = new Set(Object.keys(bundle).filter((fileName) => fileName.endsWith('.d.ts')));

      for (const fileName of declarations) {
        const asset = bundle[fileName];
        if (asset.type !== 'asset' || typeof asset.source !== 'string') continue;

        let source = asset.source;
        // From the end, so the positions of the specifiers still to go stay valid.
        for (const { specifier, start, end } of declarationSpecifiers(source).reverse()) {
          const rewritten = rewrite(specifier, fileName, declarations);
          if (rewritten !== specifier) source = source.slice(0, start) + rewritten + source.slice(end);
        }
        asset.source = source;
      }
    },
  };
}

function rewrite(specifier, fileName, declarations) {
  const directory = path.posix.dirname(fileName);
  let relative = specifier;

  // Declarations are emitted with `src` as their root (`rootDir`), so `src/x` maps to `x` under
  // the output directory.
  if (specifier.startsWith(SOURCE_ALIAS)) {
    relative = path.posix.relative(directory, specifier.slice(SOURCE_ALIAS.length));
    if (!relative.startsWith('.')) relative = `./${relative}`;
  }

  if (!relative.startsWith('.') || relative.endsWith('.js')) return relative;

  const target = path.posix.normalize(path.posix.join(directory, relative));
  if (declarations.has(`${target}.d.ts`)) return `${relative}.js`;
  if (declarations.has(`${target}/index.d.ts`)) return `${relative}/index.js`;

  throw new Error(`${fileName}: no emitted declaration for "${specifier}"`);
}
