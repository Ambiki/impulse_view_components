---
status: accepted
---

# `<awc-clipboard-copy>` is its own button

IVC prefers a native element over ARIA, and a clipboard copy could be a wrapper around a native `<button>` wired with an action. We make `<awc-clipboard-copy>` the button itself instead, as `@ambiki/clippy-copy-element` and GitHub's `<clipboard-copy>` are: it is the one element to render and style, and apps moving off clippy keep their markup's shape. Since a custom element gets nothing a native button gives for free, it does what a native button does itself: its role and disabled state are `ElementInternals` default semantics, and Enter presses it as the key goes down, Space as it comes up. Its `tabindex` is rendered by `Impulse::ClipboardCopyComponent`, which is the supported way to render it.

## Considered Options

- **A wrapper whose native `<button>` calls `copy()` through an action.** Rejected: more markup at every use, and two elements to style, for semantics the element can give itself.
- **A wrapper that copies on any click inside it.** Rejected: clicking the text it wraps, to select it, would copy.
- **`role`, `tabindex` and `aria-disabled` written as attributes on connect**, as clippy does. Rejected: a page morph syncs attributes to the server's HTML and strips the ones JavaScript wrote, leaving the element unfocusable and announced as plain text (ADR 0006).

## Consequences

- No attribute shows the element's role or disabled state, so tests read them from the browser's accessibility tree.
- `tabindex` has no `ElementInternals` equivalent. The component renders `0`, or none when disabled, since a native disabled button takes no focus. The element changes it when `disabled` changes after rendering, including while it was removed from the page. Hand-written markup must render it too.
- A disabled element stops the click in the capture phase, so no listener on the page hears it, as none hears a native disabled button's.
- Pressing it with a key clicks it, so `click` listeners hear every press, as on a native button.
- Bootstrap's `.btn:disabled` doesn't match it; `awc-clipboard-copy[disabled]` does.
