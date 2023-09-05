# Popover API

```js
const popover = document.querySelector('awc-popover');
```

## Methods

### `show`

Shows the popover.

```js
popover.show();
```

### `hide`

Hides the popover.

```js
popover.hide();
```

### `toggle`

Shows/hides the popover.

```js
popover.toggle();
```

### `reposition`

Updates the position of the popover element. If you are rendering elements lazily within the popover element, you can
call this function to update the popover's placement once the elements have been loaded.

```js
await popover.reposition();
```

## Events

| Name                 | Bubbles   | Description                                                                                                                  |
| ------               | --------- | ------------                                                                                                                 |
| `awc-popover:show`   | `true`    | This event fires immediately when the `open` attribute is added.                                                             |
| `awc-popover:shown`  | `true`    | This event fires when the popover has been made visible to the user (will wait for the focus trap to be activated).          |
| `awc-popover:hide`   | `true`    | This event fires immediately when the `open` attribute is removed.                                                           |
| `awc-popover:hidden` | `true`    | This event fires when the popover has been completely hidden from the user (will wait for the focus trap to be deactivated). |
