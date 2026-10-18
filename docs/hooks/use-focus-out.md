# useFocusOut

Listen for focus moving to an element outside the defined `boundaries`, such as on Tab past the last element of a
popover. Use it to close a floating element that keyboard users have left, so it doesn't stay open behind them.

::: tip Pair it with `useOutsideClick`
`useFocusOut` leaves most presses outside to [`useOutsideClick`](./use-outside-click.md). Use both hooks, with the same
`boundaries`, to cover the keyboard and the pointer.
:::

## Usage

```ts
import { ImpulseElement, registerElement, target } from '@ambiki/impulse';
import { useFocusOut, useOutsideClick } from '@ambiki/impulse-view-components/hooks';

@registerElement('pop-over')
export default class PopoverElement extends ImpulseElement {
  // The trigger.
  @target() button: HTMLButtonElement;

  // The floating element.
  @target() panel: HTMLElement;

  connected() {
    const boundaries = [this.button, this.panel];

    // Focus moving outside, such as on Tab past the panel's last element.
    useFocusOut(this, { boundaries, callback: () => this.hide() });

    // A press outside, including one that moves focus to a field outside.
    useOutsideClick(this, { boundaries, callback: () => this.hide() });
  }

  hide() {
    // Both callbacks can run while the panel is hidden, or for the same press.
    if (!this.open) return;
    this.panel.hidden = true;
  }

  get open() {
    return !this.panel.hidden;
  }
}
```

## Arguments

```ts
useFocusOut(element, options);
```

### `element`

| Name    | Default | Description                                                                         |
| ------- | ------- | ----------------------------------------------------------------------------------- |
| element | N/A     | The impulse element (usually `this`). The hook stops listening when it disconnects. |

### `options`

| Name       | Default | Description                                                                                                                                                                                                                                                      |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| boundaries | N/A     | An array of HTML elements that focus can move into, or between, without invoking the `callback` function. `null` entries are skipped.                                                                                                                            |
| callback   | N/A     | The function to call when focus moves outside. `event` is the `focusin` event and `target` is the element that received focus, or its shadow host when that element is in a shadow root. Signature: `callback: (event: FocusEvent, target: HTMLElement) => void` |

## What counts as focus moving out

- The `callback` runs on every move to an element outside the `boundaries`, even when focus wasn't inside them before.
  Check your own state first, such as whether the popover is open.
- Focus leaving the page, such as to another tab or window, doesn't count. Neither does focus falling back to `<body>`,
  such as when the focused element is removed.
- Focus moved by a press outside, to the element pressed or the focusable element around it, doesn't count. That press
  is left to `useOutsideClick`.
- A press outside that moves focus somewhere else, such as on a `<label>` that focuses its field, counts as well. Both
  callbacks run for it, so make them safe to run twice.
- Focus moved by a press inside does count, such as a button in the popover that opens a dialog elsewhere on the page.
- Boundaries inside a shadow root aren't supported. Focus moving into a shadow root is seen as a move to its shadow
  host.
