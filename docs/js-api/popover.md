# Popover API

```js
const popover = document.querySelector('awc-popover');
```

## Methods

### `open`

Whether the popover is open. Setting it, or adding or removing the `open` attribute, shows or hides the popover as
`show` and `hide` do. A removed popover keeps `open`, and opens again when it's added back.

```js
popover.open;
popover.open = true;
```

### `show`

Shows the popover, hides any other open popover, and moves focus into it. Emits `awc-popover:shown`, but not the
cancelable `awc-popover:show`.

```js
popover.show();
```

### `hide`

Hides the popover, and the popovers nested in it first. Focus returns to the trigger if it was inside the popover, or
lost. Emits `awc-popover:hidden`, but not the cancelable `awc-popover:hide`.

```js
await popover.hide();
```

### `requestShow`

Shows the popover as if the user asked to. Emits a cancelable `awc-popover:show`, then a cancelable `awc-popover:hide` on
each other open popover. Does nothing if any of them is prevented.

```js
popover.requestShow();
```

### `requestHide`

Hides the popover as if the user asked to. Emits a cancelable `awc-popover:hide` on each popover nested in it,
innermost first, then on the popover itself. Stops at the first one prevented: that popover and the ones it is nested
in stay open, and the ones nested in it that allowed it close. Called again with the same event, it asks no popover a
second time.

```js
await popover.requestHide();
```

### `toggle`

Shows or hides the popover as if its trigger was clicked: calls `requestShow` or `requestHide`. Pass the event that
toggled it, if any, so that a popover the same press already asked to hide isn't asked again.

```js
await popover.toggle();
```

### `reposition`

Updates the position of the popover element. If you are rendering elements lazily within the popover element, you can
call this function to update the popover's placement once the elements have been loaded.

```js
await popover.reposition();
```

## Events

Events work as they do on native elements. A user action, or a `requestShow`, `requestHide` or `toggle` call, first
emits a cancelable `show` or `hide`; calling `preventDefault()` on it stops the popover from opening or closing.
`show()`, `hide()` and changing `open` act directly, like `dialog.close()`, and emit no `show` or `hide`. `shown` and
`hidden` fire after every open and close, whatever caused it. Connecting, moving and removing the element emit nothing.

Like the other events, `show` and `hide` bubble. A listener on an element that contains other popovers receives their
`show` and `hide` too, so check `event.target` before preventing one.

| Name                 | Bubbles | Cancelable | Description                                                                                                                                                                                                                   |
| ------               | ------- | ---------- | ------------                                                                                                                                                                                                                  |
| `awc-popover:show`   | `true`  | `true`     | Fires before the popover opens for a user action or `requestShow`. Opening the popover also asks the other open popovers to hide.                                                                                             |
| `awc-popover:shown`  | `true`  | `false`    | Fires after the popover has opened.                                                                                                                                                                                           |
| `awc-popover:hide`   | `true`  | `true`     | Fires before the popover closes for a user action or `requestHide`: its trigger, a close button, Escape, an outside click, focus moving out of it, another popover opening, or a request to hide the popover it is nested in. |
| `awc-popover:hidden` | `true`  | `false`    | Fires after the popover has closed.                                                                                                                                                                                           |
