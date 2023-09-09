# Autocomplete API

```js
const autocomplete = document.querySelector('awc-autocomplete');
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

Returns all the selected values.

```js
autocomplete.value;
// => ['1', '2']
```

### `setValue`

Sets the value of the element.

```js
autocomplete.setValue('apple', 'Apple');
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
You do not have to provide the argument to `removeValue` if the element is a single select.
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

| Name                      | Bubbles   | Description                                                                                                                                                            |
| ------                    | --------- | ------------                                                                                                                                                           |
| `awc-autocomplete:show`   | `true`    | This event fires immediately when the `open` attribute is added.                                                                                                       |
| `awc-autocomplete:shown`  | `true`    | This event fires when the listbox has been made visible to the user.                                                                                                   |
| `awc-autocomplete:hide`   | `true`    | This event fires immediately when the `open` attribute is removed.                                                                                                     |
| `awc-autocomplete:hidden` | `true`    | This event fires when the listbox has been completely hidden from the user.                                                                                            |
| `awc-autocomplete:commit` | `true`    | This event fires when an option has been selected by clicking on the option element. The selected option is available by accessing the `event.detail.target` property. |
| `awc-autocomplete:clear`  | `true`    | This event fires when all the selected options have been deselected by clicking on the "Clear" button.                                                                 |
| `awc-autocomplete:remove` | `true`    | This event fires when a tag has been removed. The removed tag is available by accessing the `event.detail.target` property.                                            |
| `awc-autocomplete:reset`  | `true`    | This event fires when the parent form has been reset.                                                                                                                  |
| `loadstart`               | `false`   | This event fires when the autocomplete starts the network request.                                                                                                     |
| `load`                    | `false`   | This event fires when the autocomplete fetches the options successfully from the server.                                                                               |
| `error`                   | `false`   | This event fires when the autocomplete fails to fetch the options from the server.                                                                                     |
| `loadend`                 | `false`   | This event fires when the autocomplete finishes the network request.                                                                                                   |
