# Autocomplete API

```js
const autocomplete = document.querySelector('awc-autocomplete');
```

## TypeScript

The selection mode (single vs. multiple) determines the type of `value` and the arguments
`removeValue` accepts. TypeScript resolves these automatically when you narrow on the `multiple`
property:

```ts
const autocomplete = document.querySelector('awc-autocomplete')!;

if (autocomplete.multiple) {
  autocomplete.value; // string[]
  autocomplete.removeValue('1'); // value argument is required
} else {
  autocomplete.value; // string
  autocomplete.removeValue(); // no argument
}
```

If you already know the mode at the call site, pass the exported type to `querySelector` instead
of narrowing:

```ts
import type {
  SingleAutocompleteElement,
  MultipleAutocompleteElement,
} from '@ambiki/impulse-view-components/dist/elements/autocomplete';

const multi = document.querySelector<MultipleAutocompleteElement>('awc-autocomplete')!;
multi.value; // string[]

const single = document.querySelector<SingleAutocompleteElement>('awc-autocomplete')!;
single.value; // string
```

The source (local vs. remote) determines whether `setValue` requires the `text` argument. Because
this is driven by the `src` attribute (a string) rather than a boolean, opt into the strict typing
by querying as `RemoteAutocompleteElement` (or `LocalAutocompleteElement`):

```ts
import type {
  RemoteAutocompleteElement,
  LocalAutocompleteElement,
} from '@ambiki/impulse-view-components/dist/elements/autocomplete';

const remote = document.querySelector<RemoteAutocompleteElement>('awc-autocomplete')!;
remote.setValue('1', 'One'); // text is required
remote.setValue('1'); // ✗ type error

const local = document.querySelector<LocalAutocompleteElement>('awc-autocomplete')!;
local.setValue('1'); // text is optional
```

## Methods

### `open`

Whether the listbox is visible or not.

```js
autocomplete.open;
// => false
```

### `show`

Shows the listbox.

```js
autocomplete.show();
```

### `hide`

Hides the listbox.

```js
autocomplete.hide();
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

### `setValue`

Sets the value of the element. When the options are fetched from a remote source, the `text`
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

| Name                      | Bubbles   | Description                                                                                                                                                                            |
| ------                    | --------- | ------------                                                                                                                                                                           |
| `awc-autocomplete:show`   | `true`    | This event fires immediately when the `open` attribute is added.                                                                                                                       |
| `awc-autocomplete:shown`  | `true`    | This event fires when the listbox has been made visible to the user.                                                                                                                   |
| `awc-autocomplete:hide`   | `true`    | This event fires immediately when the `open` attribute is removed.                                                                                                                     |
| `awc-autocomplete:hidden` | `true`    | This event fires when the listbox has been completely hidden from the user.                                                                                                            |
| `awc-autocomplete:commit` | `true`    | This event fires when an option is selected or deselected by clicking the option element. You can access the committed option, its value, and its text from the `event.detail` object. |
| `awc-autocomplete:clear`  | `true`    | This event fires when all the selected options have been deselected by clicking on the "Clear" button.                                                                                 |
| `awc-autocomplete:remove` | `true`    | This event fires when a tag has been removed. You can access the removed tag, its value, and its text from the `event.detail` object.                                                  |
| `awc-autocomplete:reset`  | `true`    | This event fires when the parent form has been reset.                                                                                                                                  |
| `loadstart`               | `false`   | This event fires when the autocomplete starts the network request.                                                                                                                     |
| `load`                    | `false`   | This event fires when the autocomplete fetches the options successfully from the server.                                                                                               |
| `error`                   | `false`   | This event fires when the autocomplete fails to fetch the options from the server.                                                                                                     |
| `loadend`                 | `false`   | This event fires when the autocomplete finishes the network request.                                                                                                                   |
