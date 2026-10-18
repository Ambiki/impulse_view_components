---
status: accepted
---

# One import path per thing, shared by JS and Sass

The package's import paths exposed its build layout (`@ambiki/impulse-view-components/dist/elements/popover`), named hooks by their file rather than their function, and reached internal modules through wildcards. We give each public thing one short path: an element (`/popover`), every hook (`/hooks`), or a style entry (`/base`, `/styles.css`), with the bare path meaning every element. JS and Sass share a path through `exports` conditions: `sass` points at Sass, `style` at CSS, and a path with no CSS has no `style`. The `dist/` paths stay, frozen and deprecated.

## Considered Options

- **Separate npm packages.** Rejected: hooks and elements share their dependencies, and the JS has to match the gem's version.
- **Explicit `.scss` keys (`/popover.scss`).** Rejected: a second spelling to freeze, which still wouldn't serve Sass setups that only use `--load-path`, since those ignore `exports`.
- **Grouped element paths (`/elements/popover`).** Rejected: elements are what the package is for, so they get the shortest paths.
- **One path per hook.** Rejected: it makes users know file names, and a shared `/hooks` path tree-shakes once `sideEffects` is declared.
- **Exports from the bare path.** Rejected: importing anything from it registers every element, and a type-only import from an element path already costs nothing.
- **A `/helpers` path for `isLooselyFocusable`.** Rejected: the docs example that used it gave advice the elements no longer follow, and no other helper is meant for apps. It stays reachable at its frozen `dist/` path.
- **A `/positioning` path for the positioning types.** Rejected: ADR 0001 keeps the positioning engine internal. Each path exports the types its own API mentions instead.
- **Removing the `dist/` paths.** Rejected: apps import them, and we ship no breaking changes.

## Consequences

- Only the public API is on the new paths: the elements, the hooks, and every type their APIs mention. The helpers and the autocomplete's internal modules stay reachable only through the deprecated `dist/` paths.
- Sass reaches the new paths through a bundler or Dart Sass's `pkg:` importer (1.71+). Setups that only use `--load-path` keep the `dist/` paths.
- The element stylesheets and the full Sass entry expect Bootstrap 4's Sass to be loaded first. Only `/styles.css` stands alone.
