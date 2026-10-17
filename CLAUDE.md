# CLAUDE.md

## Changelog

- Keep `CHANGELOG.md` entries short and to the point.
- List entries newest first: add a new entry at the top of its section, not the bottom.
- Always link the pull request, with its number: `([#123](https://github.com/Ambiki/impulse_view_components/pull/123))`.
  Never link the issue or use its number.

## Accessibility

- Components must meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA.
- Follow the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern for the component's
  roles, states and keyboard interaction. Prefer a native element over ARIA when one fits.

## Rails development

- Coding guidelines are provided by the `layered-rails` skill. Invoke it before writing code.

## File names

- Name files inside `src/` with underscores, never dashes: `use_floating_ui.ts`, `focus_trap.test.ts`.
