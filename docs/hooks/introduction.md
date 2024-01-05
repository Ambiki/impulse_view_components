# Introduction

Hooks are a collection of composable behaviors that are meant to be used with [`impulse`](https://github.com/Ambiki/impulse)
elements.

## Usage

You can add new behaviors by attaching it to the `connected` lifecycle function.

In this example, we are using the [`useOutsideClick`](/hooks/use-outside-click) hook to listen for clicks outside the
`#button` element. If the user clicks outside the `#button` element, a `callback` function is invoked that removes
the `hidden` attribute from the `pop-over` element.

```ts
import { ImpulseElement, registerElement } from '@ambiki/impulse';
import useOutsideClick from '@ambiki/impulse-view-components/dist/hooks/use_outside_click';

@registerElement('pop-over')
export default class PopoverElement extends ImpulseElement {
  connected() {
    useOutsideClick(this, {
      boundaries: [document.querySelector('#button')],
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
