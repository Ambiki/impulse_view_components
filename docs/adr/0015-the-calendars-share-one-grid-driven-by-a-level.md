---
status: accepted
---

# The calendars share one grid driven by a level

The date, week, year and month calendars differ in what their cells are, days, months or years, but not in how they
behave: one tab stop, the keys that move it, paging and its limits, `commit` only when the user changes the value, the
view methods, today, and a DOM morph putting the server's page back. The date calendar will also drill up from its days
to months and years inside the same element, in the same box. So one internal grid holds all of that behaviour, and
delegates what its cells are to a **level** (#373): its cells, which page a date is on, how far each key moves, the range
a cell covers, and how it is named. `DayGridElement` and `Impulse::Internal::DayGridComponent` generalise to that grid;
the date and week calendars use the day level, the year calendar the year level, the month calendar the month level.

## Considered Options

- **A separate internal base for the twelve-cell grids**, beside the day grid. Rejected: the keyboard, view methods and
  event rules would exist twice, and drill-up would have to stitch two elements' focus, events and state together.
- **One element per calendar, sharing helper functions** rather than a base. Rejected: each element would wire the same
  lifecycle, properties, `*Changed` callbacks and actions again, which is why `OpenableElement` exists.

## Consequences

- A fix to the keyboard, paging or events lands once, for every calendar and every level.
- A level's grid is as wide as the day grid. Inside a date calendar it also fills the day grid's height, so drilling up
  never changes the calendar's size; a year calendar on its own takes only the height its years need.
- Each calendar still decides what its value selects and what `commit` carries; the level decides only what a cell is.
- The grid is internal, and isn't exported. Its public members reach apps through the calendars, so changing them
  changes the public API.
