---
status: accepted
---

# A request to hide a popover asks its nested popovers first

With a nested popover open, a click outside both closed only the nested one, and a second click closed its parent. Radix, Base UI and native `popover="auto"` close them all on one click. Yet a parent closing for its trigger, its close button or Escape closed the nested popover directly, so a nested popover refusing `hide`, such as one guarding unsaved input, was closed anyway. A popover can't close without closing the popovers nested in it, so we make a request to hide it ask them first, innermost first, then itself. The first that refuses stops the request: it and the popovers it is nested in stay open, and those nested in it that allowed it have closed. A click outside, or focus moving out, requests a hide from the outermost open popover it is outside of.

## Considered Options

- **Ask only the outermost popover**, closing the nested ones directly. Rejected: a nested popover's `hide` listener, which a click outside reached before, would no longer hear of it.
- **Let each popover decide alone**, as Radix and Base UI do. Rejected: a parent that closes takes its nested popovers with it, so a nested popover's refusal wouldn't keep it open.
- **Keep one popover per click.** Rejected: no other library or the platform does it, and pressing another popover's trigger already closed the whole chain at once.

## Consequences

- One click outside, or focus moving out, emits `hide` on the nested popover, then on its parent, and each emits `hidden` once it has closed, innermost first.
- `hide()` still closes nested popovers directly, emitting only `hidden` (ADR 0002).
- Escape still asks only the popover focus is in, which asks the popovers nested in it first. With focus in the nested popover, as it is after opening, that closes one popover at a time.
- One press asks each popover once. A press on a parent's trigger or close button asks the nested popover as the click lands, then the parent's request reaches it again, so a request for the same event gets the one already made, and waits for it. `toggle` passes its event on for this.
- Opening another popover still asks every open popover and is all-or-nothing, since the opening popover's `show` stops if one refuses.
- This is a one-off breaking change despite the frozen API.
