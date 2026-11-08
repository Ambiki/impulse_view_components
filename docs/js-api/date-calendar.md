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

None of them emit an event, and only `clear` changes the value.

### `previousPage`

Turns to the month before, as the previous button does: the day with the tab stop moves back a month. It stops at the
month holding `min`.

```js
calendar.previousPage();
```

### `nextPage`

Turns to the month after, as the next button does: the day with the tab stop moves on a month. It stops at the month
holding `max`.

```js
calendar.nextPage();
```

### `goToDate`

Shows the month of a `YYYY-MM-DD` day and gives that day the tab stop, without selecting it. It can go past `min` and
`max`.

```js
calendar.goToDate('2027-03-09');
```

### `goToToday`

Shows today's month, in the calendar's time zone, and gives today the tab stop, without selecting it.

```js
todayButton.addEventListener('click', () => calendar.goToToday());
```

### `clear`

Selects no day and shows today's month, as setting an empty `value` does. It can be called from a `data-action`.

```html
<button type="button" data-action="click->awc-date-calendar#clear">Clear</button>
```

### `isDateDisabled`

Whether the user can't commit a `YYYY-MM-DD` day: it's before `min`, after `max`, or on a disabled day of the week.

```js
calendar.isDateDisabled('2026-11-22'); // true when Sundays are disabled
```

### `focus`

Focuses the day with the tab stop. Call it when a popover holding the calendar opens, so the keys work at once.

```js
popover.addEventListener('awc-popover:shown', () => calendar.focus());
```

### `resetView`

Moves the calendar back to the selected day's month, or today's without one, and makes that day the one tab stop.
Call it when a popover holding the calendar closes.

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
