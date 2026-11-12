---
status: accepted
---

# Calendars drill up through the heading, and back down by choosing

A calendar can show more than one level in the same grid: the month calendar's months drill up to years (#374), and the
date and week calendars' days drill up to months and then years (#387). Pressing the heading shows the level above. The top
level's heading is plain text. Choosing a cell there drills back down to the view holding it; choosing the cell the
user drilled up from leaves the view as it was. `Escape` does nothing, as a popover holding the calendar already closes
on it.

The shown level is the calendar's internal view state, like the displayed month. It has no attribute, property or
event. The element reads it from its markup, so a DOM morph putting the server's base level back puts the calendar
back. `resetView()`, `goToDate()`, `goToToday()`, setting `value` and `clear()` return to the base level, as each names a
cell of it. Drilling emits no event, as paging emits none.

## Considered Options

- **The heading toggles between levels**, as in MUI and the main app's month picker. Rejected: with three levels it has
  no clear target, so MUI jumps from years straight back to days, and the grid's label becomes a button whose name
  changes with what it does.
- **A level attribute, with a method or event for drilling**, as MUI's `view`, `openTo` and `onViewChange`. Rejected
  for now: no app needs it, a public member can't be taken back, and it can be added later without breaking anything.

## Consequences

- The same rule holds for two levels or three, so the date calendar's drill-up adds levels without new behaviour.
- A user leaves an upper level without changing anything by choosing the cell they came from, which holds the tab stop,
  so `Enter` takes a keyboard user straight back. That cell is never disabled, even when none of its days falls between
  `min` and `max`, so the way back is always open.
- On a level above the base level, a cell is selected when any of its days is selected, so a week across two months
  selects both (#387).
- Focus moves into the new level's grid on every drill, as the heading button is gone on the top level. The focus move
  announces the change; the heading's live region stays quiet on a drill.
- The server renders only the base level. The element alone renders the levels above it, so the parity test covers
  only the base level.
