# Dialog API

```js
const dialog = document.querySelector('awc-dialog');
```

## Methods

### `open`

Whether the dialog is open. Setting it, or adding or removing the `open` attribute, shows or hides the dialog as `show`
and `hide` do, so `<awc-dialog open>` opens modally, unlike a native `<dialog open>`. A removed dialog keeps `open`, and
opens again when it's added back.

```js
dialog.open;
dialog.open = true;
```

### `show`

Shows the dialog. Emits `awc-dialog:shown`, but not the cancelable `awc-dialog:show`.

```js
dialog.show();
```

### `hide`

Hides the dialog. Emits `awc-dialog:hidden`, but not the cancelable `awc-dialog:hide`.

```js
dialog.hide();
```

### `requestShow`

Shows the dialog as if the user asked to. Emits a cancelable `awc-dialog:show`, and does nothing if it is prevented.

```js
dialog.requestShow();
```

### `requestHide`

Hides the dialog as if the user asked to. Emits a cancelable `awc-dialog:hide`, and does nothing if it is prevented.

```js
dialog.requestHide();
```

### `hideWithoutEmitting`

Hides the dialog, and any dialog nested in it, without dispatching any events. Like `hide`, it removes `open`.

```js
dialog.hideWithoutEmitting();
```

## Events

Events work as they do on native elements. A user action, or a `requestShow` or `requestHide` call, first emits a
cancelable `show` or `hide`; calling `preventDefault()` on it stops the dialog from opening or closing. `show()`,
`hide()` and changing `open` act directly, like `dialog.close()`, and emit no `show` or `hide`. `shown` and `hidden`
fire after every open and close, whatever caused it. Connecting, moving and removing the element emit nothing.

Like the other events, `show` and `hide` bubble. A listener on an element that contains other dialogs receives their
`show` and `hide` too, so check `event.target` before preventing one.

| Name                | Bubbles | Cancelable | Description                                                                                                   |
| ------              | ------- | ---------- | ------------                                                                                                  |
| `awc-dialog:show`   | `true`  | `true`     | Fires before the dialog opens for `requestShow`.                                                              |
| `awc-dialog:shown`  | `true`  | `false`    | Fires after the dialog has opened.                                                                            |
| `awc-dialog:hide`   | `true`  | `true`     | Fires before the dialog closes for a user action or `requestHide`: a close button, Escape, or an outside click. |
| `awc-dialog:hidden` | `true`  | `false`    | Fires after the dialog has closed, including when a `<form method="dialog">` closes it.                       |

::: tip
Browsers let a page keep a dialog open only on the first Escape after the user interacts with it. If the user presses
Escape again, the dialog closes without an `awc-dialog:hide`, and only `awc-dialog:hidden` fires.
:::
