# useOutsideClick

Listen for clicks that occur outside the defined `boundaries`.

A click counts when the press that starts it, with the primary button, lands outside every boundary. A click without a
press, such as from Enter or `click()`, doesn't count, and neither does one that another handler has prevented.

::: tip Pair it with `useFocusOut`
Keyboard users leave a popover with Tab, not a click. Use [`useFocusOut`](./use-focus-out.md), with the same
`boundaries`, to catch focus moving out.
:::

## Usage

```ts
import { ImpulseElement, registerElement } from '@ambiki/impulse';
import { useOutsideClick } from '@ambiki/impulse-view-components/hooks';

@registerElement('pop-over')
export default class PopoverElement extends ImpulseElement {
  connected() {
    useOutsideClick(this, {
      boundaries: [document.querySelector('#button')],
      callback: () => {
        // Only proceed if the popover element is open.
        if (this.open) {
          this.hidden = true;
        }
      },
    });
  }

  get open() {
    return !this.hasAttribute('hidden');
  }
}
```

## Arguments

```ts
useOutsideClick(element, options);
```

### `element`

| Name    | Default   | Description                           |
| ------  | --------- | -------------                         |
| element | N/A       | The impulse element (usually `this`). |

### `options`

| Name       | Default   | Description                                                                                                                 |
| ------     | --------- | -------------                                                                                                               |
| boundaries | N/A       | An array of HTML elements that should avoid invoking the `callback` function when clicking inside of it.                    |
| callback   | N/A       | The function to call when an outside click is detected. Signature: `callback: (event: Event, element: HTMLElement) => void` |
