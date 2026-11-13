---
status: accepted
---

# A dialog always has a title

A dialog needs an accessible name. A popover's panel gets one from its trigger when its header has no title, so its title is an optional `header.with_title` slot. A modal dialog has no trigger, so `Impulse::DialogComponent` keeps `title:` as a required argument and always renders it, with the `<dialog>` labelled by it. A header that shouldn't show it hides it with `with_header(visually_hide_title: true)`, which keeps it for assistive technology. The header's block renders between the title and the close button, as a popover's does, and `hide_close_button: true` leaves the close button out.

## Considered Options

- **Remove `title:` for a `header.with_title` slot**, as the popover did. Rejected: it breaks every dialog an app renders, and a dialog with no title would need its name from a new argument that an app can forget.
- **Make `title:` optional beside a `header.with_title` slot.** Rejected: two ways to set the title, and the same forgotten name.
- **A `header.with_title` slot that shows `title:`.** Rejected: it has the popover's name and another job. There it is the title; here it would be a switch, or a second copy of the text.
- **A header block that replaces the title**, as Primer's dialog does. Rejected: adding a badge beside the title would hide the title, and an app that writes its own heading has the title read twice.
- **A close button that follows the visible title**, as the popover's does. Rejected: hiding text would take away a way to close the dialog without the app asking for it.

## Consequences

- The dialog and the popover set their titles differently, on purpose: an argument that can be hidden, and a slot that can be left out.
- A header with nothing to show, with the title and the close button both hidden and no block, renders no header. The hidden title is still rendered in the `<dialog>`.
- Without a close button, Escape and a click outside still close the dialog. An app that turns off `hide_on_outside_click` should render its own button that calls `requestHide`.
