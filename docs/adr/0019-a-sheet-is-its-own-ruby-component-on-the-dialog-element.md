---
status: accepted
---

# A sheet is its own Ruby component on the dialog element

A sheet, a modal dialog pinned to the right edge of the viewport and filling its height, behaves exactly as a dialog does: the role, `aria-modal`, the focus trap, Escape, a click outside, scroll lock, the required title (ADR 0018) and the events (ADR 0002). Only its layout differs. We render it with a new `Impulse::SheetComponent` that renders `<awc-dialog>`, as shadcn's Sheet is built on the same Radix Dialog primitive as its Dialog. The behavior stays in one element, and each Ruby component takes only the arguments that make sense for its layout.

## Considered Options

- **A `side:` argument on `Impulse::DialogComponent`.** Rejected: `center:` controls vertical centering, which means nothing for a sheet, so `center: false, side: :right` would be a call that has to be ignored or refused.
- **One `position:` argument on the dialog (`:center`, `:top`, `:right`) replacing `center:`**, as Primer's Dialog does. Rejected: `:right` would mean pinned flush to an edge while `:top` meant centered near the top, two rules in one argument. Dropping top-alignment instead would make dialogs whose content changes height move as it does.
- **A new sheet element.** Rejected: it would duplicate the dialog's focus, dismissal and event handling for a difference that is only CSS.

## Consequences

- Both components build on an internal `Impulse::Internal::ModalDialogComponent`, which renders the element, the title and the slots. Each adds only the classes that lay it out.
- The sheet reuses `Impulse::Dialog::HeaderComponent`, `BodyComponent` and `FooterComponent`, so a form partial renders the same in a dialog and in a sheet. Its JS API and events are the dialog's: `awc-dialog:*`.
- Its styles live in the dialog's stylesheet, so the `/dialog` import path brings both (ADR 0008).
- It opens from the right only, in right-to-left pages too, since nothing else in the library flips for RTL. A `side:` argument can be added when a left sheet is needed, without breaking anything.
- It slides in with `@starting-style`, and slides out only where `overlay` is supported. Elsewhere it closes at once, as the dialog does.
- A non-modal panel that leaves the page usable is out of scope: it handles focus and Escape differently, so it would need its own element.
