# Date calendar

A grid of a month's days for choosing one. It renders no input or popover of its own: show it inline, or in a
[popover](./popover.md), and listen for the day the user commits. In a form, use a native `<input type="date">`
instead.

## Usage

```erb
<%= render(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18))) %>
```

The calendar shows the month of its value, with previous and next month buttons. Clicking a day, or pressing Enter or
Space on it, commits it: the day becomes the value and the calendar emits `awc-date-calendar:commit`. Committing the
day already selected emits nothing.

## Arguments

### Keyword arguments

| Name                  | Default                 | Description                                                                                                                       |
| ------                | -------                 | -------------                                                                                                                     |
| value                 | `nil`                   | The selected day: a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, or a string, `YYYY-MM-DD` or a time. Times are read in the time zone. |
| min                   | `nil`                   | The earliest day the user can commit, given as `value` is.                                                                         |
| max                   | `nil`                   | The latest day the user can commit, given as `value` is.                                                                           |
| disabled_days_of_week | `[]`                    | The days of the week the user can't commit, as names (`%i[saturday sunday]`) or numbers (`0` is Sunday).                          |
| first_day_of_week     | `Date.beginning_of_week` | The day each week starts on, as a name or a number.                                                                              |
| time_zone             | see below               | The time zone that decides which day is today, and which day a time falls on.                                                    |

Any other keyword arguments, such as `class` or `data`, are passed to the `<awc-date-calendar>` element as HTML
attributes. Render the calendar with the component: the element relies on the month and the settings it renders.

The time zone is `time_zone:` when given, else the zone of an `ActiveSupport::TimeWithZone` value, else `Time.zone`.
The calendar follows the app's settings, not the browser's: its time zone, its first day of the week, and its
translations.

## Examples

### Limiting the days

Days before `min`, after `max`, or on a disabled day of the week can be reached by keyboard but not committed. The
calendar doesn't page past the months holding `min` and `max`.

```erb
<%= render(Impulse::DateCalendarComponent.new(
  value: appointment.date,
  min: Date.current,
  max: 3.months.from_now,
  disabled_days_of_week: %i[saturday sunday]
)) %>
```

A value outside them is still shown selected.

### In a popover

Focus the selected day when the popover opens, so that the keys move through the grid straight away, as they do in a
date picker dialog. Close the popover when the user commits a day, and take the calendar back to the selected day when
the popover closes, so that it reopens there rather than on a month the user paged to.

```erb
<%= render(Impulse::PopoverComponent.new(data: { action: "awc-date-calendar:commit->awc-popover#requestHide" })) do |c| %>
  <% c.with_trigger(class: "btn btn-outline-secondary") { l(@date, format: :long) } %>
  <% c.with_body do %>
    <%= render(Impulse::DateCalendarComponent.new(value: @date)) %>
  <% end %>
<% end %>
```

```js
const calendar = popover.querySelector('awc-date-calendar');
popover.addEventListener('awc-popover:shown', () => calendar.focus());
popover.addEventListener('awc-popover:hidden', () => calendar.resetView());
```

### Translations

Month and weekday names come from Rails' `date.month_names`, `date.abbr_month_names`, `date.day_names` and
`date.abbr_day_names`. The button labels and the two `strftime` patterns are the calendar's own:

```yaml
en:
  impulse:
    date_calendar:
      previous_month: Previous month
      next_month: Next month
      formats:
        heading: "%B %Y" # Names the displayed month, above the grid.
        day: "%A, %B %-d, %Y" # Each day's accessible name.
```

Add them for each other locale. The patterns can use `%A %a %B %b %d %-d %e %m %Y` and `%%`.

## Accessibility

The calendar follows the grid of the
[APG date picker dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).
The grid is one tab stop, named by the month, and each day is a button named by its full date. Turning the page
announces the new month.

| Key                              | Moves to                             |
| ------                           | ------------                         |
| Left Arrow, Right Arrow          | The day before or after              |
| Up Arrow, Down Arrow             | The same day of the week before or after |
| Home, End                        | The start or end of the week         |
| Page Up, Page Down               | The same day of the month before or after |
| Shift + Page Up, Shift + Page Down | The same day of the year before or after |
| Enter, Space                     | Commits the day                      |

Moving past the edge of the month turns the page.

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/date-calendar';
```

```scss
@import '@ambiki/impulse-view-components/date-calendar';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/date-calendar.md).
