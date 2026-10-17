---
status: accepted
---

# Popovers render in the top layer and manage focus like a non-modal dialog

`<awc-popover>`'s floating element, its `panel` target, was a `<dialog>` opened with `show()`: not in the top layer, so stacking contexts and `z-index` could hide or clip it, and its focus handling was partial: it stayed open when focus left it (#148), and returned focus only when an event closed it. We render it as `<div role="dialog" popover="manual">` in the top layer, and give the popover the focus behaviour of a non-modal dialog, as Radix and Base UI do. Focus moves into the popover when it opens, returns to the trigger when it closes, and moving focus out of it asks it to close.

The popover API was used before (#73) and removed (#187) after random Chromium crashes on toggle (#174), whose cause was never found. That version showed its floating element through `popovertarget`, read its state with `matches(':popover-open')`, and loaded `@oddbird/popover-polyfill`. This one does none of those: the element shows and hides it itself, and keeps its own state (ADR 0003).

## Considered Options

- **Keep `<dialog>.show()` with `z-index`.** Rejected: it doesn't fix clipping.
- **Move the floating element to `<body>`**, as Radix and Base UI portal it. Rejected: impulse targets and actions only reach inside the element, and a form around the popover would no longer contain its fields.
- **`showModal()`.** Rejected: it makes the page inert, which is a dialog, not a popover.
- **`popover="auto"`.** Rejected: its light dismiss can't be prevented, so Escape and outside clicks couldn't emit a cancelable `hide` (ADR 0002).
- **`<dialog popover="manual">`.** Rejected: a dialog shown as a popover reports `open` as `false`, two states for one thing, which is where #174's trace pointed.
- **A modal popover, by default or as an option.** Rejected for now: `<awc-dialog>` is the modal. A modal popover would trap Tab, make the trigger inert and lock scrolling, which suits a blocking task, not a menu or a filter. It can be added later without changing the non-modal behaviour.
- **An opt-in flag for the top layer.** Rejected: two rendering paths to maintain, for a crash we guard against with tests instead.

## Consequences

- The popover renders above everything stacked with `z-index`, including inside a modal `<awc-dialog>`. `$zindex-popover` no longer applies.
- Escape, outside clicks and focus moving out are all handled by the element, so each still emits a cancelable `hide`.
- On open, focus moves to the element with `autofocus`, else the first element in the popover's tab order, else the floating element itself. A popover that connects already open doesn't take focus. The header's close button comes first in the tab order, so it has no `autofocus`, which would take focus from a page's own `autofocus` field after a Turbo visit.
- On close, focus returns to the trigger if it was inside the popover, or lost to `<body>`. If it moved to something else, such as a field clicked outside, it stays there. `<awc-dialog>` gets the same from the native modal dialog, and `<awc-autocomplete>` never moves focus out of its input.
- Focus moving to anything outside the popover, its trigger and its click boundaries, such as Tab past the last element, requests a hide. Nested popovers count as inside. A dialog elsewhere on the page that takes focus closes the popover, unless a listener prevents the `hide`. The focus that a press outside moves is left to the outside click, so that one press asks once.
- Hiding a popover hides the popovers nested in it first, each emitting `hidden`, as a dialog closes its nested dialog. A nested popover floats in the top layer on its own, and would otherwise stay behind.
- The popover is labelled by its title, or by its trigger when it has none or a custom header replaces it. The trigger has `aria-haspopup="dialog"`.
- A `<form method="dialog">` inside a popover no longer closes it, and `handleClose` is gone.
- The focus rules are shared pieces that the popover, and later the dropdown menu, compose: a `useFocusOut` hook, as `useOutsideClick` is, and helpers for moving focus in and deciding whether it returns. `OpenableElement` stays about state and events. Hooks register their cleanup through `onDisconnect`, which wraps `disconnected()` once per element (#284).
- CI stress-tests opening and closing in Chromium, Firefox and WebKit, and in Chrome through the system tests. The popover is checked by hand in Chrome before the release that ships it.
- This is a one-off breaking change, shipped in 0.9.0 despite the frozen API.
