---
status: accepted
---

# The date calendar renders its first month on the server

A date calendar's grid changes on every page turn, so its JavaScript has to render months. Rendered only by JavaScript, an inline calendar would be empty until the script loads, and a page morph to the server's empty element would wipe it. We render twice instead (#375): `DateCalendarComponent` renders the first month, and the element keeps that markup when it connects and renders only page turns. The displayed month is read from the DOM, not kept in memory, so a morph that puts the server's month back leaves the element in step.

## Considered Options

- **JavaScript renders every month, and renders again after a morph empties it.** Rejected: one renderer, but an inline calendar flashes in, and it would be the first IVC element whose markup isn't rendered by its component.
- **Reserve the grid's height with CSS until the element upgrades.** Rejected: the grid always has six rows, so the page doesn't shift, but the calendar is still blank until the script loads.
- **Render into a shadow root**, which a morph leaves alone. Rejected: it breaks the light-DOM Bootstrap styles every IVC element uses, and the app's overrides.

## Consequences

- The grid is rendered in Ruby and in TypeScript, and the two must agree. A browser test turns the page, takes the calendar back to its first month with `resetView()`, and compares the markup with the server's. Turning back would land on a clamped day after the 28th, not the server's.
- Both read the same `I18n` names and patterns (ADR 0014), so their text agrees in every locale.
- A morph takes the calendar back to the server's month and value (ADR 0003). A page the user turned to is lost.
- An `<awc-date-calendar>` written by hand or created in JavaScript renders no first month. The component is the only supported way to render one.
- The month, year and week calendars follow the same split.
