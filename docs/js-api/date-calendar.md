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

### `min` and `max`

The earliest and latest days the user can commit. The calendar doesn't page past their months.

```js
calendar.min = '2026-11-10';
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

### `i18n`

The month and weekday names and the `strftime` patterns the months are written with, as the component renders them
from the app's translations. Its type is exported as `DateCalendarI18n`.

## Methods

### `resetView`

Moves the calendar back to the selected day's month, or today's without one, and makes that day the one tab stop.
Changes no value and emits nothing. Call it when a popover holding the calendar closes.

```js
popover.addEventListener('awc-popover:hidden', () => calendar.resetView());
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
