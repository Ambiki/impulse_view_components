---
status: accepted
---

# `open` is the element's state

`<awc-popover>`, `<awc-dialog>` and `<awc-autocomplete>` read `open` only when they connected, and after that only reflected their state into it, so `el.open = false` left an open element open, with the attribute saying otherwise (#301). An impulse `@property` is its attribute, so `open` can't be made read-only without fighting the framework. We make `open` the state, as `<details open>` does: adding it opens the element and removing it closes it, through the attribute or the property alike. A change to `open` counts as code (ADR 0002): it does exactly what `show()` or `hide()` does, side effects included, and emits only the state event.

## Considered Options

- **A read-only `open`**, reflecting the state and ignoring or undoing writes. Rejected: an impulse property is its attribute, and `el.open = true` is the obvious thing to write.
- **No attribute**: a read-only getter and a CSS custom state such as `:state(open)`, as the native popover API has no `open` attribute. Rejected: breaking, since IVC's own styles and apps select on `[open]`.
- **Attribute-specific behaviour**: a non-modal dialog as native `<dialog open>` gives, a popover that leaves the others open, or batched events as `<details>` fires `toggle`. Rejected: a second way to open from code, with its own rules. A non-modal `<awc-dialog>` has no backdrop, scroll lock or focus trap, so it would be a different component.
- **Clearing `open` on removal**, as before. Rejected: native `<details>` and `<dialog>` keep it, and removal would rewrite the author's markup.

## Consequences

- `<awc-dialog open>` opens modally, unlike a native `<dialog open>`.
- Opening a popover through `open` hides the other open popovers, and each emits `hidden`.
- Setting `open` to the value it already has does nothing.
- Removing an open element keeps `open`. The element tears down, then opens again silently when it reconnects, so moving an open element keeps it open. Re-inserting an element that was open reopens it, a one-off breaking change.
- While an element is removed, or hasn't initialized yet, `show()` and `hide()` only set `open`: it opens silently when it connects, or stays closed. Requests do nothing then, since nothing is showing for a listener to keep open or closed.
- An autocomplete that connects with `open` set opens its listbox.
- A Turbo morph that renders an element without `open` closes it, and the element emits `hidden`, as a morphed `<details>` closes. `data-turbo-permanent` keeps it open.
- The dialog's `hideWithoutEmitting()` still closes it without a state event, although it removes `open`.
