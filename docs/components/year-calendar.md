# Year calendar

A grid of years for choosing one, a decade at a time. It renders no input or popover of its own: show it inline, or in
a [popover](./popover.md), and listen for the year the user commits.

## Usage

```erb
<%= render(Impulse::YearCalendarComponent.new(value: 2026)) %>
```

The calendar shows the decade of its value, 2020 to 2029, with the year before and after it, and previous and next
decade buttons. Clicking a year, or pressing Enter or Space on it, commits it: the year becomes the value and the
calendar emits `awc-year-calendar:commit`. Committing the year already selected emits nothing.

## Arguments

### Keyword arguments

| Name      | Default   | Description                                                                                                                                        |
| ------    | -------   | -------------                                                                                                                                      |
| value     | `nil`     | The selected year: an `Integer` (`2026`), a string (`"2026"`), or a `Date`, `Time` or `ActiveSupport::TimeWithZone`, read as its year in the time zone. |
| min       | `nil`     | The earliest year the user can commit, given as `value` is.                                                                                         |
| max       | `nil`     | The latest year the user can commit, given as `value` is.                                                                                           |
| time_zone | see below | The time zone that decides which year today falls in, and which year a time falls in.                                                                  |

Any other keyword arguments, such as `class` or `data`, are passed to the `<awc-year-calendar>` element as HTML
attributes. Render the calendar with the component: the element relies on the decade and the settings it renders.

The time zone is `time_zone:` when given, else the zone of an `ActiveSupport::TimeWithZone` value, else `Time.zone`.

## Examples

### Limiting the years

Years before `min` or after `max` can be reached by keyboard but not committed. The calendar doesn't page past the
decades holding `min` and `max`.

```erb
<%= render(Impulse::YearCalendarComponent.new(value: @year, min: 2000, max: Date.current)) %>
```

### In a popover

Focus the selected year when the popover opens, close the popover when the user commits a year, and take the calendar
back to the selected year's decade when the popover closes.

```erb
<%= render(Impulse::PopoverComponent.new(data: { action: "awc-year-calendar:commit->awc-popover#requestHide" })) do |c| %>
  <% c.with_trigger(class: "btn btn-outline-secondary") { @year.to_s } %>
  <% c.with_panel do |panel| %>
    <% panel.with_body do %>
      <%= render(Impulse::YearCalendarComponent.new(value: @year)) %>
    <% end %>
  <% end %>
<% end %>
```

```js
const calendar = popover.querySelector('awc-year-calendar');
popover.addEventListener('awc-popover:shown', () => calendar.focus());
popover.addEventListener('awc-popover:hidden', () => calendar.resetView());
```

### Translations

The calendar names its decade and its buttons with these keys, under `impulse.calendar.*`, which the calendars share:

```yaml
en:
  impulse:
    calendar:
      previous_decade: Previous decade
      next_decade: Next decade
      formats:
        decade: "%{start} – %{end}" # Names the displayed decade, above the grid.
```

## Accessibility

The calendar follows the grid of the
[APG date picker dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/),
as the [date calendar](./date-calendar.md#accessibility) does. The grid is one tab stop, named by its decade, and each
year is a button named by its text. Turning the page announces the new decade.

| Key                                | Moves to                                    |
| ------                             | ------------                                |
| Left Arrow, Right Arrow            | The year before or after                    |
| Up Arrow, Down Arrow               | The year three before or after              |
| Home, End                          | The start or end of the row                 |
| Page Up, Page Down, with or without Shift | The same year of the decade before or after |
| Enter, Space                       | Commits the year                            |

Moving past the edge of the decade, or onto the year before or after it, turns the page. The calendar is as wide as the
date calendar.

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/year-calendar';
```

```scss
@import '@ambiki/impulse-view-components/year-calendar';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/year-calendar.md).
