# Clipboard copy API

```js
const clipboardCopy = document.querySelector('awc-clipboard-copy');
```

Render the element with `Impulse::ClipboardCopyComponent`, which renders the `tabindex` the element needs to take
focus. The element adds a missing one when it connects, but a DOM morph to markup without one takes it away again.

## Properties

### `value`

The text to copy, reflected to the `value` attribute. When it isn't empty, it is copied instead of the copy source's
text. It is read when the element is pressed, so it can change after rendering.

```js
clipboardCopy.value = 'https://example.com/meetings/456';
```

### `for`

The `id` of the copy source, reflected to the `for` attribute. Its text is copied when `value` is empty. It is looked
up in the element's own document or shadow root when the element is pressed. A form control gives its `value`, any
other element its rendered text (`innerText`).

```js
clipboardCopy.for = 'setup-command';
```

### `disabled`

Whether the element ignores presses. Changing it also changes whether the element takes focus, and the state it is
announced with. A disabled element takes no focus, and listeners on it and its ancestors don't hear its clicks, as with a native
disabled button.

```js
clipboardCopy.disabled = true;
```

### `feedbackDuration`

How long, in milliseconds, the element stays in its feedback state after a press or a `copy` call, reflected to the
`feedback-duration` attribute. Defaults to `2000`. A change takes effect from the next copy.

```js
clipboardCopy.feedbackDuration = 1000;
```

## Methods

### `copy`

Copies the text as a press does: emits `copied` or `error`, and enters the feedback state. Unlike a press, it copies
even when the element is disabled, since `disabled` only stops the user. Resolves once the event has been emitted,
and never rejects: a failure is reported by `error`.

Firefox and Safari only let a page write to the clipboard during a user gesture. Call `copy` from one, such as another
element's click handler; called later, from a timer or after a fetch, it emits `error` with a `NotAllowedError`.

```js
menuItem.addEventListener('click', async () => {
  await clipboardCopy.copy();
  menu.hide();
});
```

## States

For `feedbackDuration` after a press, the element is in one of two
[custom states](https://developer.mozilla.org/en-US/docs/Web/CSS/:state), which CSS selects with `:state()`. Another
press starts the duration over, and removing the element from the page ends it.

| State     | Description                                                       |
| ------    | ------------                                                      |
| `copied`  | Entered just before `awc-clipboard-copy:copied` is emitted.       |
| `error`   | Entered just before `awc-clipboard-copy:error` is emitted.        |

```js
clipboardCopy.matches(':state(copied)');
```

## Events

A press (a click, Enter, or Space) or a `copy` call copies the text and then emits `copied`, or emits `error` when
nothing was copied.
Pressing with a key clicks the element, as a native button does, so `click` listeners hear every press. A disabled
element ignores presses and emits nothing for them; `copy` still copies.

The element hears a click, Enter or Space before listeners on it and its ancestors do, so calling `preventDefault()`
on one doesn't stop the copy. To keep the element from copying, disable it.

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
