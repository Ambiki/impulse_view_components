---
status: accepted
---

# The toast region follows the topmost modal dialog

Toasts must stay usable while a modal `<awc-dialog>` is open: apps copy to the clipboard and save from inside dialogs. The top layer alone doesn't do it. A modal dialog makes everything outside it inert, so a `popover="manual"` region outside the dialog is painted above it but can't be clicked or focused, in Chromium, Firefox and WebKit alike, whatever order the two were shown in ([whatwg/html#9936](https://github.com/whatwg/html/issues/9936), [#10811](https://github.com/whatwg/html/issues/10811)). Its live region is hidden from assistive technology with it. We move the toast region into the topmost open modal dialog while there is one, and back to where the layout rendered it when no modal dialog is left, as Atlassian's flags do.

## Considered Options

- **Leave the region where the layout put it**, as Web Awesome and Sonner do. Rejected: a toast shown over a dialog would be painted but unusable and unannounced.
- **Re-show the region on every toast**, to stay above a dialog opened later. Rejected: it fixes the painting, not the inertness.
- **Place each toast as it shows**, in a region inside the topmost dialog, and leave earlier toasts where they are. Rejected: toasts already showing go inert when a dialog opens over them, and the page ends up with a region per dialog.
- **Move the region only when a toast shows**, as Atlassian does. Rejected: a dialog opened while toasts are showing would still make them inert.

## Consequences

- The region watches modal dialogs opening and closing, and checks again on every `showToast`, so it also follows a dialog opened before it connected.
- The region moves with `append()` and shows itself again, since moving closes a popover. `moveBefore()` would keep it open, but below the dialog in the top layer, and elements inside the region still disconnect, as impulse elements define no `connectedMoveCallback`, so it isn't used. Toasts keep their timers across a move.
- Closing a dialog leaves a popover inside it open but not rendered, so the region moves out as the dialog closes, and its toasts outlive the dialog.
- The region has no fixed place in the DOM. App CSS must not select it by its ancestors.
- Elements inside a toast disconnect and connect again on each move.
