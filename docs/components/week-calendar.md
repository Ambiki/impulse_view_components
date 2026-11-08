# Week calendar

A grid of a month's days for choosing a week: committing any day commits its whole week. It renders no input or
popover of its own: show it inline, or in a [popover](./popover.md), and listen for the week the user commits.

## Usage

```erb
<%= render(Impulse::WeekCalendarComponent.new(value: Date.new(2026, 11, 15))) %>
```

The calendar shows the month of its selected week's first day, with previous and next month buttons, and marks the
selected week as one band. Clicking a day, or pressing Enter or Space on it, commits its week: the week's first day becomes the value and
the calendar emits `awc-week-calendar:commit` with the week's first and last days. Committing a day of the week already
selected emits nothing.

## Arguments

### Keyword arguments

| Name              | Default                  | Description                                                                                                                                       |
| ------            | -------                  | -------------                                                                                                                                     |
| value             | `nil`                    | Any day of the selected week: a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, or a string, `YYYY-MM-DD` or a time. It renders as the week's first day. |
| min               | `nil`                    | The earliest day the user can commit, given as `value` is.                                                                                         |
| max               | `nil`                    | The latest day the user can commit, given as `value` is.                                                                                           |
| first_day_of_week | `Date.beginning_of_week` | The day each week starts on, as a name or a number.                                                                                               |
| time_zone         | see below                | The time zone that decides which day is today, and which day a time falls on.                                                                     |

Any other keyword arguments, such as `class` or `data`, are passed to the `<awc-week-calendar>` element as HTML
attributes. Render the calendar with the component: the element relies on the month and the settings it renders.

The time zone is `time_zone:` when given, else the zone of an `ActiveSupport::TimeWithZone` value, else `Time.zone`.
Weeks start on `first_day_of_week:`, `Date.beginning_of_week` by default, so they match the app's own weeks.

## Examples

### Limiting the weeks

A week can be committed when any of its days is between `min` and `max`, and it commits whole, even the days outside
them. A week with no day between them can be reached by keyboard but not committed. The calendar doesn't page past the
months holding `min` and `max`.

```erb
<%= render(Impulse::WeekCalendarComponent.new(value: Date.current, min: Date.current, max: 3.months.from_now)) %>
```

### In a popover

Focus the selected week's first day when the popover opens, close the popover when the user commits a week, and take
the calendar back to the selected week when the popover closes.

```erb
<%= render(Impulse::PopoverComponent.new(data: { action: "awc-week-calendar:commit->awc-popover#requestHide" })) do |c| %>
  <% c.with_trigger(class: "btn btn-outline-secondary") { "Week of #{l(@week_start, format: :long)}" } %>
  <% c.with_body do %>
    <%= render(Impulse::WeekCalendarComponent.new(value: @week_start)) %>
  <% end %>
<% end %>
```

```js
const calendar = popover.querySelector('awc-week-calendar');
popover.addEventListener('awc-popover:shown', () => calendar.focus());
popover.addEventListener('awc-popover:hidden', () => calendar.resetView());
```

### Translations

The calendar shares the date calendar's strings, under `impulse.calendar.*` (see
[Translations](./date-calendar.md#translations)), and adds its hint:

```yaml
en:
  impulse:
    week_calendar:
      hint: Choosing a day chooses its week.
```

## Accessibility

The calendar follows the grid of the
[APG date picker dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/),
as the [date calendar](./date-calendar.md#accessibility) does: one tab stop, the same keys, and each day named by its
full date. The user moves by day, and every day of the selected week is announced as selected. A hint describes the
grid, so that screen reader users know that choosing a day chooses its week. The week under the pointer, and the week of
the day the user has moved to, are highlighted.

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/week-calendar';
```

```scss
@import '@ambiki/impulse-view-components/week-calendar';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/week-calendar.md).
