# Combobox API

`Combobox` pairs a text input with a list of options, following the
[WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). The user moves through the options
with the keyboard or the pointer, and commits the active one. `<awc-autocomplete>` is built on it; use it directly to
build your own, such as a command palette.

It never decides which options are selected. When the user commits an option, the combobox emits `combobox:commit`
from it, and your element decides what the commit does: select the option, deselect it, or run a command. If your
element has a selection, mark the selected options with `aria-selected="true"` (and the others with
`aria-selected="false"`), and add `aria-multiselectable="true"` to the list when more than one option can be selected.

```js
import Combobox from '@ambiki/impulse-view-components/dist/combobox';

class CommandPaletteElement extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.list = this.querySelector('[data-list]');
    this.combobox = new Combobox(this.input, this.list);
    this.list.addEventListener('combobox:commit', (event) => this.run(event.target));
  }

  open() {
    this.list.hidden = false;
    this.combobox.start();
  }

  close() {
    this.list.hidden = true;
    this.combobox.stop();
  }
}
```

```html
<command-palette>
  <input type="text" aria-label="Command">
  <ul data-list hidden>
    <li role="option">Go to dashboard</li>
    <li role="option" aria-disabled="true">Archive</li>
  </ul>
</command-palette>
```

Every element with `role="option"` inside the list is an option. An option with `disabled` or `aria-disabled="true"`
can be active but not committed, and a hidden option is skipped.

## Keyboard

| Key                  | Action                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| `ArrowDown`          | Activates the next visible option, wrapping around after the last.       |
| `ArrowUp`            | Activates the previous visible option, wrapping around before the first. |
| `Home`               | Activates the first visible option.                                      |
| `End`                | Activates the last visible option.                                       |
| `Enter`, `Tab`       | Commits the active option.                                               |
| `Escape`, other keys | Leave no option active.                                                  |

## Methods

### `constructor`

Gives the input `role="combobox"`, `aria-haspopup="listbox"` and `aria-autocomplete="list"`, gives the list
`role="listbox"`, and gives the list an `id` if it has none.

```js
const combobox = new Combobox(input, list);
```

### `start`

Starts listening to the input and the list, sets `aria-expanded="true"` and `aria-controls` on the input, and prepares
the options. Call it when the list opens.

```js
combobox.start();
```

### `stop`

Stops listening, sets `aria-expanded="false"` on the input, removes `aria-controls` and leaves no option active. Call it
when the list closes.

```js
combobox.stop();
```

### `activate`

Makes an option the active option: sets `data-active` on it and points the input's `aria-activedescendant` at it.

```js
combobox.activate(option, { scroll: true });
```

### `deactivate`

Leaves no option active.

```js
combobox.deactivate();
```

### `initializeOptions`

Takes the options out of the tab order and gives each one an `id`. `start()` calls it; call it again after replacing
the options while the list is open.

```js
combobox.initializeOptions();
```

### `options`

Returns every option in the list.

```js
combobox.options;
```

### `visibleOptions`

Returns the options that are rendered, which are the ones the keyboard moves through.

```js
combobox.visibleOptions;
```

### `activeOption`

Returns the active option, or `null`.

```js
combobox.activeOption;
```

## Events

| Name              | Bubbles | Cancelable | Description                                                                         |
| ----------------- | ------- | ---------- | ----------------------------------------------------------------------------------- |
| `combobox:commit` | `true`  | `false`    | Fires from an option when the user commits it, with Enter, Tab or a click.          |
