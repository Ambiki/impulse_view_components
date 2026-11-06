# Impulse View Components

Server-rendered ViewComponents paired with Web Components for interactive UI patterns (popovers, autocompletes, dialogs, selects).

## Language

### Floating UI

**Trigger**:
The element whose interaction opens or closes a floating element.
_Avoid_: Button, toggle

**Anchor**:
The element a floating element is positioned against. Defaults to the trigger, but may differ (an autocomplete's whole control, a context menu's pointer position).
_Avoid_: Reference, reference element, target

**Floating element**:
The element positioned relative to an anchor and kept inside the viewport.
_Avoid_: Popup, panel, content

**Nested popover**:
A popover inside another popover's floating element, its parent popover. It counts as part of the parent, so pressing or focusing it isn't outside the parent.
_Avoid_: Child popover, sub-popover, inner popover

**Available space**:
The room the viewport leaves a floating element where it is placed against its anchor, which the floating element may cap its size to.
_Avoid_: Remaining space, free space, viewport space

**Squashed**:
Of a floating element capped to its available space: needing more room than that space gives it.
_Avoid_: Clipped, cramped, overflowing

### Focus

**Focus return**:
Moving focus back to where an element was opened from, such as its trigger, when it closes while focus is inside it or lost.
_Avoid_: Focus restore, refocus, final focus

### Combobox

**Active option**:
The option the user has moved to, by keyboard or pointer, that a commit would choose. Distinct from a selected option.
_Avoid_: Highlighted option, focused option, current option

**Commit**:
The user choosing the active option, by Enter, Tab or a click. What it does to the selection is decided by the element built on the combobox. In a date calendar, the user choosing a day, by Enter, Space or a click.
_Avoid_: Pick, choose, submit

**Selected option**:
An option whose value is part of the element's value.
_Avoid_: Chosen option, checked option

**Deselect**:
Taking an option's value out of the element's value, by committing it again in a multiple select or by removing its tag.
_Avoid_: Unselect

**Ajax**:
Options fetched from the server rather than read from the page. An ajax select is a select whose options come this way.
_Avoid_: Remote, async, server-side

**Local**:
Options read from the page rather than fetched. The counterpart of ajax.
_Avoid_: Static, inline, client-side

### Clipboard

**Copied text**:
The text a clipboard copy writes to the clipboard: its own value when it has one, else the text of its copy source.
_Avoid_: Content, payload, clipboard value

**Copy source**:
The element a clipboard copy reads its copied text from, named by id. A form control gives its value, any other element its text as rendered.
_Avoid_: Target, source, reference

**Feedback state**:
The state a clipboard copy is in for a moment after a press: copied, or error when nothing was copied. What it looks like is up to the app.
_Avoid_: Status, result, copied attribute

### Events

**Open**:
The state of an element that is showing its floating element or dialog, recorded by its `open` attribute.
_Avoid_: Shown, visible, expanded

**Request**:
An attempt to open or close an element that listeners may refuse, made by a user action or a `request*` call.
_Avoid_: Intent, user action

**Request event**:
The cancelable event a request emits before the element opens or closes (`show`, `hide`).
_Avoid_: Before event, intent event

**State event**:
The event emitted after an element has opened or closed, or a clipboard copy has copied or failed to, whatever caused it (`shown`, `hidden`, `copied`, `error`).
_Avoid_: After event, notification, lifecycle event

**Value event**:
The event emitted after the user changes an element's value, or its form resets (`commit`, `remove`, `clear`, `reset`).
_Avoid_: Change event

### Date calendar

**Date calendar**:
A static grid of a month's days for choosing one. It has no input or popover of its own: the app shows it inline or in a popover.
_Avoid_: Inline date picker, datepicker, calendar

**Date picker**:
An input that opens a date calendar in a popover.
_Avoid_: Date field, date input

**Calendar date**:
A day with no time or offset, so it names the same day in every time zone. A date calendar's value is one.
_Avoid_: Date, datetime, timestamp

**Selected day**:
The day that is a date calendar's value. Distinct from today.
_Avoid_: Chosen day, picked day, current day

**Active day**:
The day the user has moved to in a date calendar, holding its one tab stop, that a commit by keyboard would choose. Distinct from the selected day.
_Avoid_: Focused day, highlighted day, cursor

**Page**:
What a calendar's grid shows at once: for a date calendar, its displayed month. Turning the page shows the one before
or after.
_Avoid_: Screen, sheet

**Displayed month**:
The month a date calendar's grid shows. Turning a page changes it, not the value.
_Avoid_: View date, visible month, current month

**Outside day**:
A day of the month before or after the displayed month, shown to fill the grid's six rows. Never the active day.
_Avoid_: Adjacent day, overflow day, other-month day

**Disabled day**:
A day in a date calendar that the user can move to but can't commit, because it falls before the earliest or after the latest day allowed, or on a disabled day of the week.
_Avoid_: Blocked day, unavailable day

**Today**:
The calendar date it is now in a date calendar's time zone, which may differ from the browser's.
_Avoid_: Current date, now

### Building blocks

**Hook**:
A function that attaches to an Impulse element for as long as it stays connected, and cleans up after itself when the element disconnects (`useFloatingUI`, `useOutsideClick`, `useFocusOut`).
_Avoid_: Mixin, behavior, controller
