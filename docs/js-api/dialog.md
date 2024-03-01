# Dialog API

```js
const dialog = document.querySelector('awc-dialog');
```

## Methods

### `open`

Whether the dialog is open or not.

```js
dialog.open;
```

### `show`

Shows the dialog.

```js
dialog.show();
```

### `hide`

Hides the dialog and dispatches the `awc-dialog:hidden` event.

```js
dialog.hide();
```

### `hideWithoutEmitting`

Hides the dialog and does not dispatch any events.

```js
dialog.hideWithoutEmitting();
```

## Events

| Name                | Bubbles   | Description                                             |
| ------              | --------- | ------------                                            |
| `awc-dialog:hidden` | `true`    | This event fires immediately when the dialog is hidden. |
