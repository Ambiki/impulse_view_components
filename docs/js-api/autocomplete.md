# Autocomplete API

```js
const autocomplete = document.querySelector('awc-autocomplete');
```

## Examples

### `open`

Whether the listbox is visible or not.

```js
autocomplete.open;
// => false
```

### `open=`

Shows/hides the listbox.

```js
autocomplete.open = true;
autocomplete.open;
// => true;
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
