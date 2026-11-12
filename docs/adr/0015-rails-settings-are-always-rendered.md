---
status: accepted
---

# Rails settings are always rendered

The date calendar depends on three settings an app already has in Rails and a browser has its own version of: the time zone (`Time.zone` or the browser's), the first day of the week (`Date.beginning_of_week` or the locale's) and the text (`I18n` or `Intl`). We let Rails win (#375). `DateCalendarComponent` always renders `time-zone`, `first-day-of-week` and `i18n`, and the element's JavaScript uses only those. Its own defaults, the browser's zone, Sunday and English, cover a missing attribute and nothing else. This doesn't restate a default, which ADR 0006 rules out: it passes the app's setting, which only sometimes matches the default.

## Considered Options

- **Default to the browser and the locale in JavaScript**, and render only what the app passes. Rejected: the calendar's weeks could start on another day than the app's `beginning_of_week` and `all_week`, which matters once a week calendar's value is a week's first day. `I18n` and `Intl` text differ in some locales, so the server's first month and the JavaScript's next one wouldn't match (ADR 0014).
- **Render a setting only when it differs from the JavaScript default**, as ADR 0006 does for options. Rejected: Ruby can't know the browser's zone, and comparing the app's translations with English to save a few hundred bytes adds code for nothing.

## Consequences

- The time zone comes from the `time_zone:` argument, then the zone of an `ActiveSupport::TimeWithZone` value, then `Time.zone`, and times are read in that zone. Rails zone names aren't IANA names, so the component sends `tzinfo.identifier`. A name the browser rejects falls back to the browser's zone.
- An app that never sets `config.beginning_of_week` gets Rails' default, Monday. `first_day_of_week:` overrides it per calendar.
- Month and weekday names come from Rails' `date.*` keys, and the heading and day-name patterns from `impulse.calendar.*`, which the calendars share. IVC ships English in `config/locales/en.yml`; other locales are the app's.
- Ruby marks today in the calendar's zone, and JavaScript checks it against `time-zone` when the element connects and on each page turn, so a cached page, or one left open past midnight, still marks the right day.
- `Intl` is used only to tell what day it is in a zone, never for text.
- Each calendar renders the settings it uses. A year calendar has no weeks, so it renders no `first-day-of-week`, and its `i18n` holds only the pattern that names a decade (#373).
- A calendar that drills up renders the settings of every level it shows: a month calendar's `i18n` holds its months' names and pattern, the decade pattern, and its page buttons' names on each level, under `paging` (#374).
