# useFloatingUI

A thin wrapper around [Floating UI](https://floating-ui.com/) for positioning a floating element (the
`popupElement`, such as a tooltip, dropdown, or popover) against its anchor (the `referenceElement`).

::: tip `useFloatingUI` or Anchor?
Use this hook when you are writing your own [`impulse`](https://github.com/Ambiki/impulse) element that opens and
closes a floating element. If you only need something positioned from markup, use the
[Anchor](../components/anchor.md) component instead. Both share the same positioning logic and defaults.
:::

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

| Name    | Default | Description                           |
| ------- | ------- | ------------------------------------- |
| element | N/A     | The impulse element (usually `this`). |

### `options`

Either an object, or a function that returns one. An object is read once, when the hook is created. A function is
called every time the `popupElement` is repositioned, so options that change while it's open (such as a `placement`
attribute) are picked up on the next reposition. Call the returned `update()` to reposition straight away.

`start()` keeps following the `referenceElement` and `popupElement` it found when it was called. If the function
returns different elements later, call `stop()` and then `start()` to follow the new ones.

```ts
this.floatingUI = useFloatingUI(this, () => ({
  referenceElement: this.button,
  popupElement: this.panel,
  placement: this.placement,
}));
```

| Name             | Default     | Description                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| referenceElement | N/A         | The anchor element.                                                                                                                                                                                                                                                                                                                     |
| popupElement     | N/A         | The element that you want to position with respect to the `referenceElement`.                                                                                                                                                                                                                                                           |
| arrowElement     | `undefined` | Optional arrow element pointing to the `referenceElement`.                                                                                                                                                                                                                                                                              |
| arrowPadding     | `0`         | The padding in pixels between the arrow and the edges of the `popupElement`.                                                                                                                                                                                                                                                            |
| middleware       | `[]`        | Array of custom middleware functions for fine-grained positioning control. They run after the built-in middleware and before the arrow is aligned. Read the [docs](https://floating-ui.com/docs/middleware).                                                                                                                            |
| offsetOptions    | `0`         | Adds distance between the `referenceElement` and the `popupElement`. Read the [docs](https://floating-ui.com/docs/offset).                                                                                                                                                                                                              |
| placement        | `bottom`    | The preferred placement of the `popupElement`. The actual placement may vary to keep it inside the viewport. One of `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, or `left-end`. Read the [docs](https://floating-ui.com/docs/tutorial#placements). |
| flipOptions      | `undefined` | Options for flipping the `popupElement` to another placement when the preferred one doesn't fit. Flipping is always on. Read the [docs](https://floating-ui.com/docs/flip).                                                                                                                                                             |
| shiftOptions     | `undefined` | Options for shifting the `popupElement` along the `referenceElement` to keep it inside the viewport. Shifting is always on. Read the [docs](https://floating-ui.com/docs/shift).                                                                                                                                                        |
| strategy         | `fixed`     | The value of the `position` CSS property. One of `absolute` or `fixed`.                                                                                                                                                                                                                                                                 |
| sync             | `undefined` | Matches the `popupElement`'s size to the `referenceElement`'s. One of `height`, `width`, or `both`.                                                                                                                                                                                                                                     |
| autoSize         | `undefined` | Exposes the space available to the `popupElement` as the `--awc-auto-size-height` and `--awc-auto-size-width` CSS custom properties. One of `height`, `width`, or `both`.                                                                                                                                                               |
| autoSizePadding  | `0`         | The padding in pixels to keep from the viewport edge when measuring the available space.                                                                                                                                                                                                                                                |
