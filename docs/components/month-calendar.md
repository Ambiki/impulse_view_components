# Month calendar

A grid of a year's months for choosing one. Its heading drills up to the years, to move to another year. It renders no input
or popover of its own: show it inline, or in a [popover](./popover.md), and listen for the month the user commits.

## Usage

```erb
<%= render(Impulse::MonthCalendarComponent.new(value: "2026-11")) %>
```

The calendar shows the twelve months of its value's year, with previous and next year buttons. Clicking a month, or
pressing Enter or Space on it, commits it: the month becomes the value and the calendar emits
`awc-month-calendar:commit`. Committing the month already selected emits nothing.

Pressing the heading, which names the year, shows the years of its decade in the same grid. Choosing a year shows its
months again, and choosing the year shown leaves the months as they were. Neither commits anything.

## Arguments

### Keyword arguments

| Name      | Default   | Description                                                                                                                                       |
| ------    | -------   | -------------                                                                                                                                     |
| value     | `nil`     | The selected month: a string (`"2026-11"`), or a `Date`, `Time` or `ActiveSupport::TimeWithZone`, read as its month in the time zone.            |
| min       | `nil`     | The earliest month the user can commit, given as `value` is.                                                                                       |
| max       | `nil`     | The latest month the user can commit, given as `value` is.                                                                                         |
| time_zone | see below | The time zone that decides which month today falls in, and which month a time falls in.                                                           |

Any other keyword arguments, such as `class` or `data`, are passed to the `<awc-month-calendar>` element as HTML
attributes. Render the calendar with the component: the element relies on the year and the settings it renders.

The value is written as native `<input type="month">` writes it, `YYYY-MM`. The time zone is `time_zone:` when given,
else the zone of an `ActiveSupport::TimeWithZone` value, else `Time.zone`.

## Examples

### Limiting the months

Months before `min` or after `max` can be reached by keyboard but not committed. Years with no month between them can't
be chosen, except the year shown, which always takes the user back to its months. The calendar doesn't page past the years holding `min` and `max`, or past their decades on the years.

```erb
<%= render(Impulse::MonthCalendarComponent.new(value: @month, min: "2020-01", max: Date.current)) %>
```

### In a popover

Focus the selected month when the popover opens, close the popover when the user commits a month, and take the calendar
back to the selected month when the popover closes.

```erb
<%= render(Impulse::PopoverComponent.new(data: { action: "awc-month-calendar:commit->awc-popover#requestHide" })) do |c| %>
  <% c.with_trigger(class: "btn btn-outline-secondary") { l(@month, format: "%b %Y") } %>
  <% c.with_panel do |panel| %>
    <% panel.with_body do %>
      <%= render(Impulse::MonthCalendarComponent.new(value: @month)) %>
    <% end %>
  <% end %>
<% end %>
```

```js
const calendar = popover.querySelector('awc-month-calendar');
popover.addEventListener('awc-popover:shown', () => calendar.focus());
popover.addEventListener('awc-popover:hidden', () => calendar.resetView());
```

### Translations

The calendar names its months with Rails' `date.month_names` and `date.abbr_month_names`, and its heading and buttons
with these keys, under `impulse.calendar.*`, which the calendars share:

```yaml
en:
  impulse:
    calendar:
      previous_year: Previous year
      next_year: Next year
      previous_decade: Previous decade
      next_decade: Next decade
      choose_year: Choose a year # Describes the heading's button.
      formats:
        month: "%B %Y" # Each month's accessible name.
        decade: "%{start} – %{end}" # Names the displayed decade, above the years.
```

## Accessibility

The calendar follows the grid of the
[APG date picker dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/),
as the [date calendar](./date-calendar.md#accessibility) does. The grid is one tab stop, named by its year, and each
month is a button named by its month and year, such as "November 2026". Turning the page announces the new year.

The heading is a button named by its year and described as "Choose a year". Pressing it moves focus to the year shown,
in a grid named by its decade, which announces the change. Choosing a year moves focus to the same month in that year,
or to the nearest month `min` and `max` allow. The decade heading can't be pressed: choose the year shown to go back.
Escape is left to a popover holding the calendar.

| Key                                        | Moves to                                  |
| ------                                     | ------------                              |
| Left Arrow, Right Arrow                    | The month before or after                 |
| Up Arrow, Down Arrow                       | The month three before or after           |
| Home, End                                  | The start or end of the row               |
| Page Up, Page Down, with or without Shift  | The same month of the year before or after |
| Enter, Space                               | Commits the month                         |

On the years, the keys are the [year calendar](./year-calendar.md#accessibility)'s, and Enter or Space chooses the
year. Moving past the edge of the year turns the page. The calendar is as wide as the date calendar, and the same size
on the months and the years.

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/month-calendar';
```

```scss
@import '@ambiki/impulse-view-components/month-calendar';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/month-calendar.md).
