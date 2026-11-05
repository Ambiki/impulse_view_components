# Introduction

Hooks are functions that attach to an [`impulse`](https://github.com/Ambiki/impulse) element while it stays
connected, and clean up after themselves when it disconnects.

## Usage

Call a hook from the element's `connected` lifecycle callback.

In this example, the [`useOutsideClick`](./use-outside-click.md) hook listens for clicks outside the `pop-over` element
and the `#button` element. When the user clicks outside both, the `callback` hides the `pop-over` element by adding the
`hidden` attribute.

```ts
import { ImpulseElement, registerElement } from '@ambiki/impulse';
import { useOutsideClick } from '@ambiki/impulse-view-components/hooks';

@registerElement('pop-over')
export default class PopoverElement extends ImpulseElement {
  connected() {
    useOutsideClick(this, {
      boundaries: [this, document.querySelector('#button')],
      callback: () => {
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
