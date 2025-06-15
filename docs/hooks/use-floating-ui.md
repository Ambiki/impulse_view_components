# useFloatingUI

A thin wrapper around [Floating UI](https://floating-ui.com/) for positioning floating elements
(such as tooltips, dropdowns, or popovers) relative to a reference element.

## Usage

```ts
import { ImpulseElement, registerElement, target } from '@ambiki/impulse';
import useFloatingUI from '@ambiki/impulse-view-components/dist/hooks/use_floating_ui';

@registerElement('pop-over')
export default class PopoverElement extends ImpulseElement {
  // The anchor element.
  @target() button: HTMLButtonElement;

  // The element to be positioned relative to the anchor.
  @target() panel: HTMLElement;

  private floatingUI: ReturnType<typeof useFloatingUI>;

  connected() {
    this.floatingUI = useFloatingUI(this, {
      referenceElement: this.button,
      popupElement: this.panel,
      placement: 'bottom',
    });
  }

  show() {
    // Show the popover.
    this.panel.hidden = false;
    // Start positioning logic.
    this.floatingUI.start();
  }

  async hide() {
    // Hide the popover.
    this.panel.hidden = true;
    // Stop positioning logic.
    await this.floatingUI.stop();
  }

  // Required for Floating UI to calculate positioning.
  get open() {
    return !this.panel.hasAttribute('hidden');
  }
}
```

## Arguments

```ts
useFloatingUI(element, options);
```

### `element`

| Name    | Default   | Description                           |
| ------  | --------- | -------------                         |
| element | N/A       | The impulse element (usually `this`). |

### `options`

| Name             | Default        | Description                                                                                                                                                                                                                                                                                                                     |
| ------           | ---------      | -------------                                                                                                                                                                                                                                                                                                                   |
| referenceElement | N/A            | The anchor element.                                                                                                                                                                                                                                                                                                             |
| popupElement     | N/A            | The element that you want to position with respect to the `referenceElement`.                                                                                                                                                                                                                                                   |
| arrowElement     | `undefined`    | Optional arrow element pointing to the `referenceElement`.                                                                                                                                                                                                                                                                      |
| middleware       | `[]`           | Array of custom middleware functions for fine-grained positioning control. Read the [docs](https://floating-ui.com/docs/middleware).                                                                                                                                                                                            |
| offsetOptions    | `0`            | Adds distance between the `referenceElement` and the `popupElement`. Read the [docs](https://floating-ui.com/docs/offset).                                                                                                                                                                                                      |
| placement        | `bottom-start` | The preferred placement of the `popupElement`. May change automatically to stay within the viewport. One of `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, or `left-end`. Read the [docs](https://floating-ui.com/docs/tutorial#placements). |
| flipOptions      | `undefined`    | Automatically flips the `popupElement` to the opposite side if there's not enough space. Read the [docs](https://floating-ui.com/docs/flip).                                                                                                                                                                                    |
| shiftOptions     | `undefined`    | Prevents overflow by shifting the `popupElement` along its alignment axis. Read the [docs](https://floating-ui.com/docs/shift).                                                                                                                                                                                                 |
| strategy         | `fixed`        | CSS positioning strategy: either `absolute` or `fixed`. One of `absolute`, or `fixed`.                                                                                                                                                                                                                                          |
| sync             | `undefined`    | Syncs the dimensions of the `popupElement` with the `referenceElement`. One of `height`, `width`, or `both`.                                                                                                                                                                                                                    |
| autoSize         | `undefined`    | Adjusts the dimensions of the `popupElement` to dynamically fit the viewport. One of `height`, `width`, or `both`.                                                                                                                                                                                                              |
| autoSizePadding  | `0`            | Extra space (in pixels) to add beyond the `popupElement`'s dimensions. Applies only when `autoSize` is set.                                                                                                                                                                                                                     |
