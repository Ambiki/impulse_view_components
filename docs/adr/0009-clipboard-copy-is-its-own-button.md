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
- `tabindex` has no `ElementInternals` equivalent. The component renders `0`, or none when disabled, since a native disabled button takes no focus. The element puts it in step with `disabled` when it connects and whenever `disabled` changes. Hand-written markup must render it too, or a morph to that markup takes it away.
- The element listens with impulse's `on`, delegated from the document in the capture phase. It hears a press before listeners on it and its ancestors do, so one that stops the event's propagation can't keep the press from copying. The cost is that `preventDefault()` on a click, Enter or Space comes too late to cancel the press, as it would on a native button; disabling the element is the way to stop it. In a shadow root, the element reads the event's composed path, since the document sees the shadow host as the target.
- A disabled element stops the click before listeners on it and its ancestors hear it, as none hears a native disabled button's. Listeners in the window's capture phase, or added to the document's before impulse's, still do.
- Pressing it with a key clicks it, so `click` listeners hear every press, as on a native button.
- Bootstrap's `.btn:disabled` doesn't match it; `awc-clipboard-copy[disabled]` does.
