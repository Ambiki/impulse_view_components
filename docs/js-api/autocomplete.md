# Autocomplete API

```js
const autocomplete = document.querySelector('awc-autocomplete');
```

## TypeScript

The selection mode (single vs. multiple) determines the type of `value` and the arguments
`removeValue` accepts, and the source (local vs. ajax) determines whether `setValue` requires
the `text` argument. TypeScript resolves these automatically when you narrow on the `multiple` and
`ajax` properties:

```ts
const autocomplete = document.querySelector('awc-autocomplete')!;

if (autocomplete.multiple) {
  autocomplete.value; // string[]
  autocomplete.removeValue('1'); // value argument is required
} else {
  autocomplete.value; // string
  autocomplete.removeValue(); // no argument
}

if (autocomplete.ajax) {
  autocomplete.setValue('1', 'One'); // text is required
} else {
  autocomplete.setValue('1'); // text is optional
}
```

If you already know the mode at the call site, pass the exported type to `querySelector` instead
of narrowing:

```ts
import type {
  MultipleAutocompleteElement,
  SingleAutocompleteElement,
} from '@ambiki/impulse-view-components/dist/elements/autocomplete';

const multi = document.querySelector<MultipleAutocompleteElement>('awc-autocomplete')!;
multi.value; // string[]

const single = document.querySelector<SingleAutocompleteElement>('awc-autocomplete')!;
single.value; // string
```

If you already know the source at the call site, you can also pass the exported type to
`querySelector` instead of narrowing on `ajax`:

```ts
import type {
  AjaxAutocompleteElement,
  LocalAutocompleteElement,
} from '@ambiki/impulse-view-components/dist/elements/autocomplete';

const ajax = document.querySelector<AjaxAutocompleteElement>('awc-autocomplete')!;
ajax.setValue('1', 'One'); // text is required
ajax.setValue('1'); // ✗ type error

const local = document.querySelector<LocalAutocompleteElement>('awc-autocomplete')!;
local.setValue('1'); // text is optional
```

Each alias leaves the other dimension open, but they are composable — pass the other dimension as a
type argument to pin both at once:

```ts
const el = document.querySelector<MultipleAutocompleteElement<'ajax'>>('awc-autocomplete')!;
el.value; // string[]
el.setValue('1', 'One'); // text is required

// `AjaxAutocompleteElement<'multiple'>` resolves to the same type.
```

## Methods

### `open`

Whether the listbox is open. Setting it, or adding or removing the `open` attribute, shows or hides the listbox as
`show` and `hide` do. A removed autocomplete keeps `open`, and opens its listbox again when it's added back.

```js
autocomplete.open;
// => false
autocomplete.open = true;
```

### `show`

Shows the listbox. Emits `awc-autocomplete:shown`, but not the cancelable `awc-autocomplete:show`.

```js
autocomplete.show();
```

### `hide`

Hides the listbox. Emits `awc-autocomplete:hidden`, but not the cancelable `awc-autocomplete:hide`.

```js
await autocomplete.hide();
```

### `requestShow`

Shows the listbox as if the user asked to. Emits a cancelable `awc-autocomplete:show`, and does nothing if it is
prevented.

```js
autocomplete.requestShow();
```

### `requestHide`

Hides the listbox as if the user asked to. Emits a cancelable `awc-autocomplete:hide`, and does nothing if it is
prevented.

```js
await autocomplete.requestHide();
```

### `value`

Returns the selected value(s). For a single select this is a `string`; for a multiple select it
is a `string[]`.

```js
// Multiple select
autocomplete.value;
// => ['1', '2']

// Single select
autocomplete.value;
// => '1'
```

### `ajax`

Whether the options are fetched from the server (i.e. the `src` attribute is set). Narrowing
on this resolves source-dependent types — see [TypeScript](#typescript).

```js
autocomplete.ajax;
// => true
```

### `setValue`

Sets the value of the element. When the options are fetched from the server, the `text`
argument is required (the option is not in the DOM, so its text cannot be derived); for local
options it is optional. See [TypeScript](#typescript) for how to enforce this at compile time.

```js
autocomplete.setValue('apple', 'Apple');
autocomplete.value;
// => ['apple']

// When the options are not loaded from the server, you do not have to pass the text argument.
autocomplete.setValue('apple');
autocomplete.value;
// => ['apple']
```

### `removeValue`

Removes a value from the element.

```js
autocomplete.removeValue('apple');
autocomplete.value;
// => []
```

::: tip
The `value` argument is required for a multiple select and is not used by a single select (which
clears its value when `removeValue()` is called). TypeScript enforces this when the mode is known —
see [TypeScript](#typescript).
:::

### `activate`

Activates an option by setting the `data-active` attribute.

```js
const option = autocomplete.options[0];
autocomplete.activate(option, { scroll: true });
```

### `deactivate`

Deactivates the active option by removing the `data-active` attribute.

```js
autocomplete.deactivate();
```

### `clear`

Deselects all the selected options.

```js
autocomplete.clear();
```

### `reset`

Resets the autocomplete value to its initial state.

```js
autocomplete.reset();
```

### `focus`

Sets the focus on the input element. This method also accepts a list of focus [options](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#parameters).

```js
autocomplete.focus();
```

### `blur`

Removes keyboard focus from the input element.

```js
autocomplete.blur();
```

### `activeOption`

Returns the option that has the `data-active` attribute.

```js
autocomplete.activeOption;
```

### `visibleOptions`

Returns all the visible options of the autocomplete element.

```js
autocomplete.visibleOptions;
```

### `options`

Returns all the options of the autocomplete element.

```js
autocomplete.options;
```

### `form`

Returns the parent form element.

```js
autocomplete.form;
```

## Events

Events work as they do on native elements. A user action (pressing or typing in the input, Escape, Alt+ArrowDown,
Alt+ArrowUp, an outside click, the input losing focus, committing an option, clearing), or a `requestShow` or
`requestHide` call, first emits a cancelable `show` or `hide`; calling `preventDefault()` on it keeps the listbox closed
or open. `show()`, `hide()` and changing `open` act directly and emit no `show` or `hide`, and neither does closing
because the form reset. `shown` and `hidden` fire after every open and close. Removing the element emits nothing.

Like `input` and `change`, `commit`, `clear`, `remove` and `reset` fire after the value has changed, and only when the
user changed it or the form reset: `setValue`, `removeValue`, `clear` and `reset` called from code emit nothing.

`commit` reports the option's state after the commit in `event.detail.selected`: `true` when the commit selected it,
`false` when it deselected it in a multiple select.

```js
autocomplete.addEventListener('awc-autocomplete:commit', (event) => {
  const { value, selected } = event.detail;
  console.log(selected ? `Selected ${value}` : `Deselected ${value}`);
});
```

::: warning
In a single select, committing the option that is already selected emits `commit` with `selected: true`, although the
value doesn't change. A future release will stop emitting it, as a native `<select>` emits no `change` when the user
selects the option that is already selected ([#310](https://github.com/Ambiki/impulse_view_components/issues/310)).
:::

| Name                      | Bubbles | Cancelable | Description                                                                                                                                                                            |
| ------------------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `awc-autocomplete:show`   | `true`  | `true`     | Fires before the listbox opens for a user action or `requestShow`.                                                                                                                     |
| `awc-autocomplete:shown`  | `true`  | `false`    | Fires after the listbox has opened.                                                                                                                                                    |
| `awc-autocomplete:hide`   | `true`  | `true`     | Fires before the listbox closes for a user action or `requestHide`.                                                                                                                    |
| `awc-autocomplete:hidden` | `true`  | `false`    | Fires after the listbox has closed.                                                                                                                                                    |
| `awc-autocomplete:commit` | `true`  | `false`    | Fires when the user commits an option. `event.detail` carries the option, its value, its text, and `selected`: whether the option is selected after the commit.                        |
| `awc-autocomplete:clear`  | `true`  | `false`    | This event fires when all the selected options have been deselected by clicking on the "Clear" button.                                                                                 |
| `awc-autocomplete:remove` | `true`  | `false`    | This event fires when a tag has been removed. You can access the removed tag, its value, and its text from the `event.detail` object.                                                  |
| `awc-autocomplete:reset`  | `true`  | `false`    | This event fires when the parent form has been reset.                                                                                                                                  |
| `loadstart`               | `false` | `false`    | This event fires when the autocomplete starts the network request.                                                                                                                     |
| `load`                    | `false` | `false`    | This event fires when the autocomplete fetches the options successfully from the server.                                                                                               |
| `error`                   | `false` | `false`    | This event fires when the autocomplete fails to fetch the options from the server.                                                                                                     |
| `loadend`                 | `false` | `false`    | This event fires when the autocomplete finishes the network request.                                                                                                                   |
