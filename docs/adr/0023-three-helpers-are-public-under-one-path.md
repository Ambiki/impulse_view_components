---
status: accepted
---

# `cycle`, `debounce` and `scrollLock` are public under `/helpers`

ADR 0008 kept the helpers off the short paths, and ADR 0012 made them internal: no helper was meant for apps, and a
`/helpers` path for `isLooselyFocusable` alone was rejected. Apps now want three of them, `cycle`, `debounce` and
`scrollLock`, so we export those by name from one `/helpers` path, as `/hooks` exports the hooks. Every helper module
moves to `src/internal`, alongside the rest of the internal code, and `src/helpers/index.ts` only re-exports the three.

## Considered Options

- **One path each** (`/array`, `/debounce`, `/scroll-lock`). Rejected for the reason ADR 0008 rejected one path per
  hook: it makes users know file names. A shared path tree-shakes, as `/hooks` does.
- **`/utils`.** Rejected: the same shape under another name. `/helpers` matches the `dist/helpers/*` paths apps
  imported them from before ADR 0012.
- **Export every helper.** Rejected: `isLooselyFocusable`, `stripCSSUnit` and `uniqueId` serve the elements alone, and
  exporting them would freeze them too.

## Consequences

- `cycle`, `debounce`, the `Cancelable` type and `scrollLock` are public API: changing them changes the package's API.
  The modules they live in stay internal, so moving or splitting them doesn't.
- `isLooselyFocusable` joins the focus helpers in `src/internal/focus.ts`.
- `scrollLock`, now public, keeps the page locked until every lock is released in any order. It used to restore the
  styles the last lock saw, so two locks released in the order they were taken left the page locked.
