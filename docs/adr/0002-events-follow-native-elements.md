---
status: accepted
---

# Elements emit events the way native elements do

Each element emitted its open and close events its own way: the popover only from its trigger, the dialog only `hidden`, the autocomplete from every `show()` and `hide()` call. None of the events could be cancelled (#300). We model all of them on native elements instead. A **request** (a user action, or a `requestShow()`, `requestHide()` or `toggle()` call) emits a cancelable **request event** (`show`, `hide`) and acts only if no listener prevents it, as Escape on a `<dialog>` fires `cancel` and `form.requestSubmit()` fires `submit`. `show()` and `hide()` act directly, as `dialog.close()` and `form.submit()` do, and emit no request event. Every open and close, whatever causes it, emits a **state event** (`shown`, `hidden`), as `toggle` and `close` do. Connecting and disconnecting are silent.

## Considered Options

- **Request events on `show()` and `hide()` too**, as Bootstrap's `show.bs.modal` and native `showPopover()` do. Rejected: code that calls `hide()` has decided, and a listener vetoing it would leave `await popover.hide()` resolving with the popover still open.
- **The native close-request split**, where Escape and outside clicks are cancelable but an explicit close button closes straight away. Rejected: to the user, a close button and Escape lose unsaved input alike, and apps would have to guard close buttons separately.
- **A `{ cancelable: true }` option on `show()` and `hide()`** instead of separate methods. Rejected: the platform doesn't use options for this, and an option is easy to forget in a markup action.
- **Keep the autocomplete's `show()` and `hide()` emitting `show` and `hide`**, as an exception, or deprecate that first. Rejected: the exception would keep in the rule the inconsistency this decision removes. Dropping them is accepted as a one-off breaking change despite the frozen API.

## Consequences

- Every user action that opens or closes an element is a request: a trigger click, a close button, Escape, an outside click, the input losing focus, committing an option, clearing. IVC's markup wires close buttons to `requestHide`; markup still wired to `hide` keeps closing, without a request event.
- A close that follows a form reset is direct, since the reset can come from code and the value is already gone.
- Opening a popover first emits its `show`, then requests that the other open popovers close. If one of them refuses, the popover doesn't open. A `show` that no `shown` follows, or a `hide` that no `hidden` follows, means the request was stopped, by that element's listener or by another's.
- Pressing a closed popover's trigger doesn't count as an outside click for the open popovers: opening it requests that they close.
- An element that connects already open, moves, or is removed emits nothing.
- A close the element didn't start, such as a `<form method="dialog">` submitting, still emits `hidden`. So does a dialog's second Escape: browsers let a page cancel only the first Escape after a user interaction, so the dialog emits no `hide` it couldn't honour.
- The dialog's existing `hideWithoutEmitting()` stays as the one way to close without a state event.
- Changing the `open` attribute counts as code: if it ever opens or closes an element, it does so directly.
- **Value events** (`commit`, `remove`, `clear`, `reset`) follow `input` and `change`: they are emitted after the user changes the value, never for value methods called from code, and are not cancelable. A veto would be a separate `before*` event, as `beforeinput` is. `reset` follows the form's own `reset`, whoever reset it.
