# Clipboard copy API

```js
import '@ambiki/impulse-view-components/clipboard-copy';

const clipboardCopy = document.querySelector('awc-clipboard-copy');
```

Render the element with `Impulse::ClipboardCopyComponent`. It renders the `tabindex` the element needs to take focus.

## Attributes

### `value`

The text to copy. When present, even empty, it is copied instead of the copy source's text. It is read when the
element is pressed, so it can change after rendering.

```js
clipboardCopy.setAttribute('value', 'https://example.com/meetings/456');
```

### `for`

The `id` of the copy source, looked up in the element's own document or shadow root when the element is pressed. A
form control gives its `value`, any other element its rendered text (`innerText`).

## Properties

### `disabled`

Whether the element ignores presses. Changing it also changes whether the element takes focus, and the state it is
announced with. A disabled element takes no focus and no click reaches the page, as with a native disabled button.

```js
clipboardCopy.disabled = true;
```

## Events

A press (a click, Enter, or Space) copies the text and then emits `copied`, or emits `error` when nothing was copied.
Pressing with a key clicks the element, as a native button does, so `click` listeners hear every press. A disabled
element ignores presses and emits nothing.

The events are emitted from the element once the write has finished. If the press removed the element from the page,
say by replacing the menu it was in, they don't reach listeners on `document`.

| Name                         | Bubbles | Cancelable | Description                                                                                                                                                                                               |
| ------                       | ------- | ---------- | ------------                                                                                                                                                                                              |
| `awc-clipboard-copy:copied`  | `true`  | `false`    | Fires once the clipboard holds the copied text. `event.detail.text` is the copied text.                                                                                                                   |
| `awc-clipboard-copy:error`   | `true`  | `false`    | Fires when nothing was copied. `event.detail.error` is why: a `NotFoundError` when there is nothing to copy, a `NotSupportedError` when the page has no Clipboard API, or the browser's own rejection, usually a `NotAllowedError`. |

Importing the element types its events for `addEventListener`. The details are exported as
`AwcClipboardCopyCopiedEvent` and `AwcClipboardCopyErrorEvent`.

```ts
document.addEventListener('awc-clipboard-copy:copied', (event) => {
  const { text } = event.detail;
});
```
