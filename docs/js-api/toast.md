# Toast API

```js
import { showToast } from '@ambiki/impulse-view-components/toast';

const region = document.querySelector('awc-toast-region');
const toast = document.querySelector('awc-toast');
```

## `showToast`

Shows a toast in the page's toast region, built from a message or from a `<template>` holding a toast. A toast with
the `id` of one already showing updates that one in place. Resolves with the `<awc-toast>` once it is showing, or with
`null`, and a console warning, when the page has no region.

```js
const toast = await showToast('Saved', { variant: 'success' });
```

| Option     | Description                                                                                       |
| ------     | -------------                                                                                     |
| `variant`  | `'info'`, `'success'`, `'warning'` or `'danger'`. Defaults to `'info'`.                           |
| `title`    | A title, shown above the message. A toast from a template takes it only if the template's has a title. |
| `duration` | How long, in milliseconds, the toast shows. `Infinity` keeps it until it is dismissed.            |
| `id`       | The toast's `id`.                                                                                 |

The options are exported as `ToastOptions`.

## `showToast.promise`

Shows a toast while a promise is pending, which stays until it settles, then updates it in place: a success toast once
the promise resolves, or a danger toast once it rejects. Returns the promise; a rejection the caller ignores isn't
reported as unhandled.

```js
showToast.promise(createEvent(), {
  loading: 'Creating event…',
  success: (event) => `${event.name} created.`,
  error: 'Could not create event.',
});
```

| Option    | Description                                                                                      |
| ------    | -------------                                                                                    |
| `loading` | The message while the promise is pending.                                                        |
| `success` | The message once it resolves, or a function of its value that returns one.                      |
| `error`   | The message once it rejects, or a function of the reason that returns one.                      |
| `title`   | A title, shown above the message at every step.                                                  |
| `id`      | The toast's `id`. Without one, each call gets its own toast.                                     |

The options are exported as `ToastPromiseOptions`.

## Region properties

### `placement`

Where the toasts show: `'top-start'`, `'top-center'`, `'top-end'`, `'bottom-start'`, `'bottom-center'` or
`'bottom-end'`. Defaults to `'top-center'`.

```js
region.placement = 'bottom-end';
```

### `hotkey`

The key that moves focus to the newest toast, and back to where it was. Defaults to `'F8'`; empty turns it off. The
region's `aria-label`, which names the key, doesn't change with it.

```js
region.hotkey = 'F9';
```

## Toast properties

### `open`

Whether the toast is showing. Setting it shows or hides the toast as `show` and `hide` do.

```js
toast.open;
// => true
```

### `variant`

`'info'`, `'success'`, `'warning'` or `'danger'`. Defaults to `'info'`.

```js
toast.variant;
// => 'success'
```

### `duration`

How long, in milliseconds, the toast shows; `Infinity` keeps it until it is dismissed. Without a `duration` attribute,
a danger toast and one holding an action stay until dismissed, and the others hide after `5000`. Setting it while the
toast is showing starts its timer over.

```js
toast.duration;
// => 5000
```

## Toast methods

### `show`

Shows the toast. Emits `awc-toast:shown`.

```js
toast.show();
```

### `hide`

Hides the toast and removes it from the region. Emits `awc-toast:hidden`, but not the cancelable `awc-toast:hide`.

```js
await toast.hide();
```

### `requestShow`

Shows the toast as if the user asked to. Emits a cancelable `awc-toast:show`, and does nothing if it is prevented.

```js
toast.requestShow();
```

### `requestHide`

Hides the toast as if the user asked to. Emits a cancelable `awc-toast:hide`, and does nothing if it is prevented.

```js
await toast.requestHide();
```

## Events

Events work as they do on native elements. The close button and Escape ask the toast to hide, emitting a cancelable
`hide` first; calling `preventDefault()` on it keeps the toast. `show()`, `hide()`, changing `open` and the timer
running out act directly, and emit no `show` or `hide`. `shown` and `hidden` fire after every show and hide, including
the show of a toast rendered into the region, or added to it, once it connects. Updating a toast in place, and moving
and removing it, emit nothing.

| Name               | Bubbles | Cancelable | Description                                           |
| ------             | ------- | ---------- | ------------                                          |
| `awc-toast:show`   | `true`  | `true`     | Fires before `requestShow` shows the toast.           |
| `awc-toast:shown`  | `true`  | `false`    | Fires after the toast shows.                          |
| `awc-toast:hide`   | `true`  | `true`     | Fires before the user, or `requestHide`, hides it.    |
| `awc-toast:hidden` | `true`  | `false`    | Fires after the toast hides, before it is removed.    |

```js
document.addEventListener('awc-toast:hide', (event) => {
  if (unsaved) event.preventDefault();
});
```
