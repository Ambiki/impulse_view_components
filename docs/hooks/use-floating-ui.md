# useFloatingUI

A thin wrapper around [Floating UI](https://floating-ui.com/) for positioning a floating element, such as a tooltip,
dropdown, or popover, against its anchor.

::: tip `useFloatingUI` or Anchor?
Use this hook when you are writing your own [`impulse`](https://github.com/Ambiki/impulse) element that opens and
closes a floating element. If you only need something positioned from markup, use the
[Anchor](../components/anchor.md) component instead. Both share the same positioning logic and defaults.
:::

## Usage

```ts
import { ImpulseElement, registerElement, target } from '@ambiki/impulse';
import { useFloatingUI } from '@ambiki/impulse-view-components/hooks';

@registerElement('pop-over')
export default class PopoverElement extends ImpulseElement {
  // The anchor.
  @target() button: HTMLButtonElement;

  // The floating element, positioned against the anchor.
  @target() panel: HTMLElement;

  private floatingUI: ReturnType<typeof useFloatingUI>;

  connected() {
    this.floatingUI = useFloatingUI(this, {
      anchorElement: this.button,
      floatingElement: this.panel,
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
called every time the `floatingElement` is repositioned, so options that change while it's open (such as a `placement`
attribute) are picked up on the next reposition. Call the returned `update()` to reposition straight away.

`start()` keeps following the `anchorElement` and `floatingElement` it found when it was called. If the function
returns different elements later, call `stop()` and then `start()` to follow the new ones.

```ts
this.floatingUI = useFloatingUI(this, () => ({
  anchorElement: this.button,
  floatingElement: this.panel,
  placement: this.placement,
}));
```

| Name            | Default     | Description                                                                                                                                                                                                                                                                                                                                |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| anchorElement   | N/A         | The element (or a virtual element, such as a pointer position) to position against.                                                                                                                                                                                                                                                        |
| floatingElement | N/A         | The element to position against the `anchorElement`.                                                                                                                                                                                                                                                                                       |
| arrowElement    | `undefined` | An element inside the `floatingElement` that points at the `anchorElement`.                                                                                                                                                                                                                                                                |
| arrowPadding    | `0`         | The padding in pixels between the arrow and the edges of the `floatingElement`.                                                                                                                                                                                                                                                            |
| middleware      | `[]`        | Array of custom middleware functions for fine-grained positioning control. They run after the built-in middleware and before the arrow is aligned. Read the [docs](https://floating-ui.com/docs/middleware).                                                                                                                               |
| offsetOptions   | `0`         | Adds distance between the `anchorElement` and the `floatingElement`. Read the [docs](https://floating-ui.com/docs/offset).                                                                                                                                                                                                                 |
| placement       | `bottom`    | The preferred placement of the `floatingElement`. The actual placement may vary to keep it inside the viewport. One of `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, or `left-end`. Read the [docs](https://floating-ui.com/docs/tutorial#placements). |
| flipOptions     | `undefined` | Options for flipping the `floatingElement` to another placement when the preferred one doesn't fit. Flipping is always on. Read the [docs](https://floating-ui.com/docs/flip).                                                                                                                                                             |
| keepFlipped     | `false`     | Keeps the side the `floatingElement` flipped to until `stop()` is called, instead of trying `placement` first on every reposition, so it doesn't jump back once its content shrinks. It still flips again when that side stops fitting.                                                                                                    |
| shiftOptions    | `undefined` | Options for shifting the `floatingElement` along the `anchorElement` to keep it inside the viewport. Shifting is always on. Read the [docs](https://floating-ui.com/docs/shift).                                                                                                                                                           |
| strategy        | `fixed`     | The value of the `position` CSS property. One of `absolute` or `fixed`.                                                                                                                                                                                                                                                                    |
| sync            | `undefined` | Matches the `floatingElement`'s size to the `anchorElement`'s. One of `height`, `width`, or `both`.                                                                                                                                                                                                                                        |
| autoSize        | `undefined` | Exposes the space available to the `floatingElement` as the `--awc-auto-size-height` and `--awc-auto-size-width` CSS custom properties. One of `height`, `width`, or `both`. A `floatingElement` capped to that space flips when it is squashed and the other side has more room.                                                          |
| autoSizePadding | `0`         | The padding in pixels to keep from the viewport edge when measuring the available space.                                                                                                                                                                                                                                                   |
