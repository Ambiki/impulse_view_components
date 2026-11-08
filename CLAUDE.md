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

- Name files inside `src/` with underscores, never dashes: `use_floating_ui.ts`, `use_outside_click.test.ts`.

## Events

Elements follow native HTML event semantics ([ADR 0002](docs/adr/0002-events-follow-native-elements.md)). Follow the ADR for component-specific behavior and exceptions.

- **Requests:** User interactions go through `request*` or `handle*` methods. Explicit request methods and `toggle()` also count as requests when called from code. Request events (`show`, `hide`) fire before acting, are cancelable, and must be honored.
- **Direct changes:** Public state methods (`show`, `hide`), property or attribute changes, and morphs act directly. They never emit request or user-only value events.
- **State events:** Emit `shown` or `hidden` after every actual state transition, regardless of its cause. Idempotent operations emit nothing. Connecting, disconnecting, and moving elements are silent. Honor documented exceptions.
- **Value events:** Follow native `input`/`change` semantics. Emit after user-driven changes, using the committed value captured during the operation rather than re-reading mutable state. Value events are not cancelable; use a separate `before*` event for vetoes. Honor documented exceptions.
- **Event arguments:** An event argument describes the cause of an operation. It must never determine whether an event is emitted.
- **One request per action:** A single user action requests each affected element at most once. Avoid duplicate requests through nested handlers or delegated listeners.
- **Documentation:** Declare every event in the element's typed event map and JS API events table.
- **Tests:** Verify that direct methods emit no request or user-only value events, actual state transitions emit the correct state events, canceled requests do not perform their requested transition, and user interactions emit exactly the expected event sequence.
