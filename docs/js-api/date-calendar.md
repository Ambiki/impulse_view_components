# Date calendar API

```js
const calendar = document.querySelector('awc-date-calendar');
```

## Properties

Days are `YYYY-MM-DD` strings. Changing a property after render updates the grid.

### `value`

The selected day. Anything else selects no day. Setting it moves the calendar to the day's month, and emits nothing.

```js
calendar.value = '2026-12-24';
```

### `min`

The earliest day the user can commit. The calendar doesn't page back past its month.

```js
calendar.min = '2026-11-10';
```

### `max`

The latest day the user can commit. The calendar doesn't page on past its month.

```js
calendar.max = '2027-02-28';
```

### `disabledDaysOfWeek`

The days of the week the user can't commit, `0` being Sunday.

```js
calendar.disabledDaysOfWeek = [0, 6];
```

### `firstDayOfWeek`

The day each week starts on, `0` being Sunday.

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
component renders them from the app's translations. Its type is exported as `DateCalendarI18n`.

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

Shows the month of a `YYYY-MM-DD` day, on the days, and gives that day the tab stop, without selecting it. It can go
past `min` and `max`.

```js
calendar.goToDate('2027-03-09');
```

### `goToToday`

Shows today's month, in the calendar's time zone, on the days, and gives today the tab stop, without selecting it.

```js
calendar.goToToday();
```

### `clear`

Selects no day and shows today's month, on the days, as setting an empty `value` does.

```js
calendar.clear();
```

### `isDateDisabled`

Whether a `YYYY-MM-DD` day is disabled: it's before `min`, after `max`, or on a disabled day of the week. It doesn't
follow `disabled`.

```js
calendar.isDateDisabled('2026-11-22'); // true when Sundays are disabled
```

### `focus`

Focuses the day with the tab stop, or the month or year on the months or years.

```js
calendar.focus();
```

### `resetView`

Moves the calendar back to the selected day's month, or today's without one, on the days, and makes that day the one tab
stop.

```js
calendar.resetView();
```

## Events

| Name                       | Bubbles | Cancelable | Description                                                                                         |
| ------                     | ------- | ---------- | ------------                                                                                        |
| `awc-date-calendar:commit` | `true`  | `false`    | Fires when the user commits a day other than the selected one. `event.detail.value` is the day.    |

It doesn't fire when the value is set from code. The detail is exported as `AwcDateCalendarCommitEvent` from
`@ambiki/impulse-view-components/date-calendar`.

```ts
document.addEventListener('awc-date-calendar:commit', (event) => {
  const { value } = event.detail;
});
```
