# Month calendar API

```js
const calendar = document.querySelector('awc-month-calendar');
```

## Properties

Months are `YYYY-MM` strings. Changing a property after render updates the grid.

### `value`

The selected month. Anything else selects no month. Setting it moves the calendar to the month's year, on the months,
and emits nothing.

```js
calendar.value = '2031-04';
```

### `min`

The earliest month the user can commit. The calendar doesn't page back past its year.

```js
calendar.min = '2020-01';
```

### `max`

The latest month the user can commit. The calendar doesn't page on past its year.

```js
calendar.max = '2030-12';
```

### `timeZone`

The IANA time zone that decides which month today falls in, such as `America/New_York`.

### `i18n`

The names and patterns the months and years are rendered with, as the component renders them from the app's
translations. Its type is exported as `MonthCalendarI18n`.

## Methods

### `previousView`

Shows the year before, as the previous button does: the month with the tab stop moves back a year. It stops at the
year holding `min`. On the years, it shows the decade before.

```js
calendar.previousView();
```

### `nextView`

Shows the year after, as the next button does: the month with the tab stop moves on a year. It stops at the year
holding `max`. On the years, it shows the decade after.

```js
calendar.nextView();
```

### `goToDate`

Shows the year of a `YYYY-MM` month, on the months, and gives that month the tab stop, without selecting it. It can go
past `min` and `max`.

```js
calendar.goToDate('1999-07');
```

### `goToToday`

Shows today's year, in the calendar's time zone, on the months, and gives today's month the tab stop, without selecting
it.

```js
calendar.goToToday();
```

### `clear`

Selects no month and shows today's year, on the months, as setting an empty `value` does.

```js
calendar.clear();
```

### `isDateDisabled`

Whether the user can't commit a `YYYY-MM` month: it's before `min` or after `max`.

```js
calendar.isDateDisabled('2031-01'); // true when max is 2030-12
```

### `focus`

Focuses the month with the tab stop, or the year on the years.

```js
calendar.focus();
```

### `resetView`

Moves the calendar back to the selected month's year, or today's without one, on the months, and makes that month the
one tab stop.

```js
calendar.resetView();
```

## Events

| Name                        | Bubbles | Cancelable | Description                                                                                              |
| ------                      | ------- | ---------- | ------------                                                                                             |
| `awc-month-calendar:commit` | `true`  | `false`    | Fires when the user commits a month other than the selected one. `event.detail.value` is the month.     |

It doesn't fire when the value is set from code, or when the user moves to the years and back. The detail is exported
as `AwcMonthCalendarCommitEvent` from `@ambiki/impulse-view-components/month-calendar`.

```ts
document.addEventListener('awc-month-calendar:commit', (event) => {
  const { value } = event.detail;
});
```
