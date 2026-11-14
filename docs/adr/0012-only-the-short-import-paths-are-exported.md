---
status: accepted, superseded in part by ADR 0023
---

# Only the short import paths are exported

ADR 0008 kept the `dist/` import paths, frozen and deprecated, beside the short ones. Their wildcards made every element, hook, helper and style file public, so renaming an internal module was a breaking change. We remove them: `exports` holds only the short paths, and the helpers and the autocomplete's internal modules, which only the `dist/` paths reached, become internal.

## Considered Options

- **Keep them deprecated.** Rejected: every internal file stays frozen for as long as they do.
- **Remove only the paths with a replacement.** Rejected: no helper or autocomplete module is meant for apps (ADR 0008), and keeping their paths freezes their code.

## Consequences

- An app that imports a `dist/` path fails to resolve it. Getting Started maps each one to its replacement.
- The `dist/` files still ship, so Sass setups that only use `--load-path` keep importing them as files.
- Resolvers that ignore `exports`, such as TypeScript's `node10`, still reach any file in the package.
- This is a one-off breaking change despite the frozen API.
