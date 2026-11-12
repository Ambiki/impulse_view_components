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
_Avoid_: Popup, content

**Panel**:
A popover's floating element: the dialog its trigger shows, holding the header and body. Only popovers have a panel; elsewhere, say floating element.
_Avoid_: Content, popup, container

**Nested popover**:
A popover inside another popover's panel, its parent popover. It counts as part of the parent, so pressing or focusing it isn't outside the parent.
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
A static grid of a month's days for choosing one. Its heading drills up to months, then years. It has no input or
popover of its own: the app shows it inline or in a popover.
_Avoid_: Inline date picker, datepicker, calendar

**Week calendar**:
A date calendar's grid for choosing a week: committing any day commits its week. It drills up as a date calendar does,
and like one, it has no input or popover of its own.
_Avoid_: Week picker, inline week picker

**Year calendar**:
A static grid of years for choosing one. Like a date calendar, it has no input or popover of its own.
_Avoid_: Year picker, decade picker

**Month calendar**:
A static grid of a year's months for choosing one. Its heading drills up to years. Like a date calendar, it has no
input or popover of its own.
_Avoid_: Month picker

**Date picker**:
An input that opens a date calendar in a popover.
_Avoid_: Date field, date input

**Calendar date**:
A day with no time or offset, so it names the same day in every time zone. A date calendar's value is one.
_Avoid_: Date, datetime, timestamp

**Date range**:
Two calendar dates, a start and an end, and every day from one to the other, both included. A week is one: from the
first day of the week to the last.
_Avoid_: Interval, period, span

**Week**:
The seven days from a first day of the week, which is a setting of the calendar rather than of the locale.
_Avoid_: ISO week, calendar week

**Selected day**:
The day that is a date calendar's value. Distinct from today.
_Avoid_: Chosen day, picked day, current day

**Selected week**:
The week a week calendar's value falls in. Any day of it names it; a commit names it by its first day.
_Avoid_: Highlighted week, current week

**Active day**:
The day the user has moved to in a calendar, holding its one tab stop, that a commit by keyboard would choose. Distinct from the selected day.
_Avoid_: Focused day, highlighted day, cursor

**Level**:
The kind of cell a calendar's grid shows: days, months or years. A date or week calendar shows days, a month calendar
months, and a year calendar years. A calendar's base level is the one its value is a cell of.
_Avoid_: View, mode, zoom, scale

**Drill up**:
Pressing a calendar's heading to show the level above, in the same grid: a date calendar's days drill up to months,
and its months to years. The top level's heading can't be pressed. Choosing a cell there drills back down, to the view
holding it; choosing the cell the user drilled up from leaves the view as it was. On a level above the base level, a
cell is selected when any of its days is selected, so a week across two months selects both.
_Avoid_: Zoom out, switch view, toggle view

**View**:
What a calendar shows at once: for a date or week calendar, its displayed month; for a month calendar, its displayed
year; for a year calendar, its displayed decade. The previous and next views are the ones before and after it.
_Avoid_: Screen, sheet

**Displayed month**:
The month a calendar's grid shows. Turning a page changes it, not the value.
_Avoid_: View date, visible month, current month

**Outside day**:
A day of the month before or after the displayed month, shown to fill the grid's six rows. Never the active day.
_Avoid_: Adjacent day, overflow day, other-month day

**Displayed decade**:
The ten years a year calendar's grid shows, from a year ending in 0. Moving to another view changes it, not the value.
_Avoid_: Year page, year range, period

**Displayed year**:
The year a month calendar's grid shows. Moving to another view changes it, not the value.
_Avoid_: Year page, current year

**Outside year**:
The year before or after the displayed decade, shown to fill the grid's twelve cells. Never the active year.
_Avoid_: Adjacent year, overflow year

**Disabled day**:
A day in a calendar that the user can move to but can't commit. In a date calendar, it falls before the earliest or after the latest day allowed, or on a disabled day of the week. In a week calendar, its week is a disabled week.
_Avoid_: Blocked day, unavailable day

**Disabled week**:
A week in a week calendar that the user can move through but can't commit, because none of its days falls between the
earliest and the latest day allowed, or because it reaches past the four-digit years. Its days are the week calendar's
only disabled days.
_Avoid_: Blocked week, unavailable week

**Disabled month**:
A month in a month calendar that the user can move to but can't commit, because it falls before the earliest or after
the latest month allowed.
_Avoid_: Blocked month, unavailable month

**Disabled year**:
A year that the user can move to but can't choose. In a year calendar, it falls before the earliest or after the latest
year allowed, or outside the four-digit years, 1000 to 9999, which are all a value names. In a month calendar drilled
up, none of its months falls between the earliest and the latest month allowed, unless it's the year the user drilled up
from, which always takes them back.
_Avoid_: Blocked year, unavailable year

**Today**:
The calendar date it is now in a calendar's time zone, which may differ from the browser's.
_Avoid_: Current date, now

### Building blocks

**Hook**:
A function that attaches to an Impulse element for as long as it stays connected, and cleans up after itself when the element disconnects (`useFloatingUI`, `useOutsideClick`, `useFocusOut`).
_Avoid_: Mixin, behavior, controller
