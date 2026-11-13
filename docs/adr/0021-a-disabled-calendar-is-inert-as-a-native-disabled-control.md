---
status: accepted
---

# A disabled calendar is inert, as a native disabled control

The calendars already have disabled days, months and years, which the user can move to but can't commit. A whole calendar's `disabled` could have meant that too: every cell disabled, the grid still browsable. We make a disabled calendar inert instead, as `<input type="date" disabled>` is, and as React Aria's `isDisabled` and MUI's `disabled` are: it holds no tab stop, and none of its cells, page buttons or heading can be pressed. Every component in the package that takes `disabled` means it this way, and a calendar shouldn't be the one where it means something else. Browsing without committing is read-only, a separate property if an app ever needs it.

Each of the calendar's buttons is made a native disabled button, rendered by the server and by the element on every page, and the `role="grid"` table takes `aria-disabled="true"`.

## Considered Options

- **Every cell a disabled cell, the grid still focusable and paged.** Rejected: that is read-only, as React Aria's `isReadOnly`, MUI's `readOnly` and the APG grid's `aria-readonly` name it. Giving `disabled` that meaning would leave no word for the native one.
- **`inert` on the element or its grid.** Rejected: one attribute blocks focus and clicks, but inert content leaves the accessibility tree, so a screen reader wouldn't find the calendar or its value. A native disabled button stays in the tree, announced as unavailable.
- **`aria-disabled` and `tabindex="-1"` on every cell, with each handler checking `disabled`.** Rejected: the most code, every handler must remember the check, and pointer events still reach the cells.

## Consequences

- A click on a cell's padding lands on its `<td>`, not its disabled button, so the browser still fires it. The element's click handler checks `disabled` itself before committing.
- A disabled day keeps `aria-disabled` and its tab stop on an enabled calendar. On a disabled calendar it is a native disabled button like every other cell, and still struck through.
- Methods and properties keep working while the calendar is disabled, as `value` and `stepUp()` do on a disabled `<input>`: code can change the value and move the view. `focus()` does nothing, as no button takes focus.
- Disabling the calendar while one of its cells has focus drops focus to `<body>`, as disabling a focused native button does. The app that disabled it decides where focus goes.
- `isDateDisabled` answers for the date, from `min`, `max` and the calendar's own limits, whatever `disabled` is. An app reads `disabled` for the calendar.
- A calendar in a `<fieldset disabled>` is already inert, as its buttons are native ones, but it isn't dimmed and its grid isn't announced as disabled. Following the fieldset would make the calendar form-associated, a choice for every component, not this one.
