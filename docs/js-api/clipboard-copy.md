# Clipboard copy API

```js
const clipboardCopy = document.querySelector('awc-clipboard-copy');
```

## Properties

### `value`

The text to copy. When empty, the copy source's text is copied instead.

```js
clipboardCopy.value = 'https://example.com/meetings/456';
```

### `for`

The `id` of the copy source. A form control gives its value, any other element its rendered text.

```js
clipboardCopy.for = 'setup-command';
```

### `disabled`

Whether the element ignores presses. Like a native disabled button, it takes no focus and its clicks don't reach
listeners.

```js
clipboardCopy.disabled = true;
```

### `feedbackDuration`

How long, in milliseconds, the feedback state lasts. Defaults to `2000`.

```js
clipboardCopy.feedbackDuration = 1000;
```

## Methods

### `copy`

Copies the text, even when disabled. Resolves once `copied` or `error` is emitted; never rejects.

Firefox and Safari only allow clipboard writes during a user gesture, so call it from one, such as a click handler.

```js
menuItem.addEventListener('click', async () => {
  await clipboardCopy.copy();
  menu.hide();
});
```

## States

After a copy, the element is in a [custom state](https://developer.mozilla.org/en-US/docs/Web/CSS/:state) for
[`feedbackDuration`](#feedbackduration). Another copy restarts it.

| State    | Description                         |
| ------   | ------------                        |
| `copied` | The text was copied.                |
| `error`  | Nothing was copied.                 |

```js
clipboardCopy.matches(':state(copied)');
```

## Events

A press is a click, Enter, or Space. `preventDefault()` doesn't stop it; disable the element instead. If the press
removes the element, its events don't reach `document`.

| Name                        | Bubbles | Cancelable | Description                                                                                                                                                   |
| ------                      | ------- | ---------- | ------------                                                                                                                                                  |
| `awc-clipboard-copy:copied` | `true`  | `false`    | Fires once the text is copied. `event.detail.text` is the copied text.                                                                                        |
| `awc-clipboard-copy:error`  | `true`  | `false`    | Fires when nothing was copied. `event.detail.error` is a `NotFoundError` (nothing to copy), a `NotSupportedError` (no Clipboard API), or the browser's rejection. |

The details are exported as `AwcClipboardCopyCopiedEvent` and `AwcClipboardCopyErrorEvent`.

```ts
document.addEventListener('awc-clipboard-copy:copied', (event) => {
  const { text } = event.detail;
});
```
