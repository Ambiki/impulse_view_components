# Week calendar API

```js
const calendar = document.querySelector('awc-week-calendar');
```

## Properties

Days are `YYYY-MM-DD` strings. Changing a property after render updates the grid.

### `value`

The selected week's first day. Any day selects the week it falls in, and is kept as given. Anything else selects no
week. Setting it moves the calendar to the day's month, and emits nothing.

```js
calendar.value = '2026-12-06';
```

### `min`

The earliest day the user can commit. A week with any day from `min` on can be committed. The calendar doesn't page
back past its month.

```js
calendar.min = '2026-11-11';
```

### `max`

The latest day the user can commit. A week with any day up to `max` can be committed. The calendar doesn't page on past
its month.

```js
calendar.max = '2027-02-28';
```

### `firstDayOfWeek`

The day each week starts on, `0` being Sunday. Changing it reads the value's day in the new weeks.

### `timeZone`

The IANA time zone that decides which day is today, such as `America/New_York`.

### `disabled`

Whether the calendar is disabled: none of its buttons can be focused or pressed. Code can still change its value and its
view.

```js
calendar.disabled = true;
```

### `i18n`

The names and patterns the days, months and years are written with, and the page buttons' names on each, as the
component renders them from the app's translations. Its type is exported as `WeekCalendarI18n`.

## Methods

### `previousView`

Shows the month before, as the previous button does: the day with the tab stop moves back a month. It stops at the month
holding `min`. On the months or years, it shows the year or decade before.

```js
calendar.previousView();
```

### `nextView`

Shows the month after, as the next button does: the day with the tab stop moves on a month. It stops at the month
holding `max`. On the months or years, it shows the year or decade after.

```js
calendar.nextView();
```

### `goToDate`

Shows the month of a `YYYY-MM-DD` day, on the days, and gives that day the tab stop, without selecting its week. It can
go past `min` and `max`.

```js
calendar.goToDate('2027-03-09');
```

### `goToToday`

Shows today's month, in the calendar's time zone, on the days, and gives today the tab stop, without selecting its week.

```js
calendar.goToToday();
```

### `clear`

Selects no week and shows today's month, on the days, as setting an empty `value` does.

```js
calendar.clear();
```

### `isDateDisabled`

Whether a `YYYY-MM-DD` day is disabled: none of its week's days is between `min` and `max`. It doesn't follow
`disabled`.

```js
calendar.isDateDisabled('2026-11-07'); // true when min is 2026-11-11, with weeks from Sunday
```

### `focus`

Focuses the day with the tab stop, or the month or year on the months or years.

```js
calendar.focus();
```

### `resetView`

Moves the calendar back to the month of the value's day, or today's without one, on the days, and makes that day the one
tab stop.

```js
calendar.resetView();
```

## Events

| Name                       | Bubbles | Cancelable | Description                                                                                                                                                            |
| ------                     | ------- | ---------- | ------------                                                                                                                                                           |
| `awc-week-calendar:commit` | `true`  | `false`    | Fires when the user commits a day of a week other than the selected one. `event.detail.value` is the week's first day, and `start` and `end` its first and last days. |

It doesn't fire when the value is set from code. The detail is exported as `AwcWeekCalendarCommitEvent` from
`@ambiki/impulse-view-components/week-calendar`.

```ts
document.addEventListener('awc-week-calendar:commit', (event) => {
  const { value, start, end } = event.detail;
});
```
