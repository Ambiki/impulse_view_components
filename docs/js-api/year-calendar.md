# Year calendar API

```js
const calendar = document.querySelector('awc-year-calendar');
```

## Properties

Years are `YYYY` strings. Changing a property after render updates the grid.

### `value`

The selected year. Anything else selects no year. Setting it moves the calendar to the year's decade, and emits nothing.

```js
calendar.value = '2031';
```

### `min`

The earliest year the user can commit. The calendar doesn't page back past its decade.

```js
calendar.min = '2000';
```

### `max`

The latest year the user can commit. The calendar doesn't page on past its decade.

```js
calendar.max = '2030';
```

### `timeZone`

The IANA time zone that decides which year today falls in, such as `America/New_York`.

### `i18n`

The pattern the decades are named with, as the component renders it from the app's translations. Its type is exported
as `YearCalendarI18n`.

## Methods

### `previousView`

Shows the decade before, as the previous button does: the year with the tab stop moves back ten years. It stops at the
decade holding `min`.

```js
calendar.previousView();
```

### `nextView`

Shows the decade after, as the next button does: the year with the tab stop moves on ten years. It stops at the decade
holding `max`.

```js
calendar.nextView();
```

### `goToDate`

Shows the decade of a `YYYY` year and gives that year the tab stop, without selecting it. It can go past `min` and
`max`.

```js
calendar.goToDate('1999');
```

### `goToToday`

Shows the decade of today's year, in the calendar's time zone, and gives that year the tab stop, without selecting it.

```js
calendar.goToToday();
```

### `clear`

Selects no year and shows the decade of today's year, as setting an empty `value` does.

```js
calendar.clear();
```

### `isDateDisabled`

Whether the user can't commit a `YYYY` year: it's before `min` or after `max`.

```js
calendar.isDateDisabled('2031'); // true when max is 2030
```

### `focus`

Focuses the year with the tab stop.

```js
calendar.focus();
```

### `resetView`

Moves the calendar back to the selected year's decade, or today's year's without one, and makes that year the one
tab stop.

```js
calendar.resetView();
```

## Events

| Name                       | Bubbles | Cancelable | Description                                                                                          |
| ------                     | ------- | ---------- | ------------                                                                                         |
| `awc-year-calendar:commit` | `true`  | `false`    | Fires when the user commits a year other than the selected one. `event.detail.value` is the year.   |

It doesn't fire when the value is set from code. The detail is exported as `AwcYearCalendarCommitEvent` from
`@ambiki/impulse-view-components/year-calendar`.

```ts
document.addEventListener('awc-year-calendar:commit', (event) => {
  const { value } = event.detail;
});
```
