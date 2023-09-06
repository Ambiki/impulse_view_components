import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import type { Placement } from '@floating-ui/dom';
import focusTrap from 'src/helpers/focus_trap';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { stripCSSUnit } from '../../helpers/string';
import { isFocusable } from 'tabbable';

@registerElement('awc-popover')
export default class AwcPopoverElement extends ImpulseElement {
  /**
   * Whether the popover is open or not.
   */
  @property({ type: Boolean }) open = false;

  /**
   * The placement of the popover. The actual placement will vary to keep the popover inside the viewport.
   * @see https://floating-ui.com/docs/computePosition#placement for a comprehensive list of all available placements.
   */
  @property() placement: Placement = 'bottom';

  /**
   * The CSS selector of the element that should avoid closing the popover when clicked inside.
   */
  @property({ type: Array }) clickBoundaries: string[] = [];

  @target() button: HTMLButtonElement;
  @target() panel: HTMLElement;
  @target() arrow?: HTMLElement;

  private floatingUI: UseFloatingUIType;
  private _focusTrap?: AbortController;

  connected() {
    this.floatingUI = useFloatingUI(this, {
      referenceElement: this.button,
      popupElement: this.panel,
      arrowElement: this.arrow,
      arrowPadding: this.arrowPadding,
      placement: this.placement,
      offsetOptions: 8,
      flipOptions: {
        fallbackAxisSideDirection: 'end',
      },
    });

    useOutsideClick(this, {
      boundaries: this.boundaries,
      callback: (event: Event, target: HTMLElement) => {
        if (this.open) {
          this.open = false;
          // Prevent modals from closing accidentally.
          if (!isFocusable(target)) {
            event.preventDefault();
          }
        }
      },
    });

    // Don't start focus trap.
    if (this.open) {
      this.button.setAttribute('aria-expanded', 'true');
      this.floatingUI.start();
    }
  }

  disconnected() {
    this.open = false;
  }

  async openChanged(newValue: boolean) {
    if (newValue) {
      this.emit('show');
      this.button.setAttribute('aria-expanded', 'true');
      this.floatingUI.start();
      this._focusTrap = focusTrap(this.panel);
      this.emit('shown');
    } else {
      this.emit('hide');
      this.button.setAttribute('aria-expanded', 'false');
      await this.floatingUI.stop();
      this._focusTrap?.abort();
      this.emit('hidden');
    }
  }

  handleButtonClick() {
    if (this.button.disabled || this.button.getAttribute('aria-disabled') === 'true') return;
    this.toggle();
  }

  toggle() {
    this.open = !this.open;
  }

  show() {
    if (this.open) return;
    this.open = true;
  }

  hide() {
    if (!this.open) return;
    this.open = false;
  }

  handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        if (this.open) {
          // prevent modals from accidentally closing.
          event.preventDefault();
          event.stopPropagation();
          this.open = false;
        }
        break;
    }
  }

  async reposition() {
    await this.floatingUI.update();
  }

  private get arrowPadding() {
    const borderRadius = getComputedStyle(this.panel).borderRadius;
    return stripCSSUnit(borderRadius) || 2;
  }

  private get boundaries() {
    const elements = this.clickBoundaries.map((s) => document.querySelector<HTMLElement>(s));
    return elements.concat([this.button, this.panel]);
  }
}

declare global {
  interface Window {
    AwcPopoverElement: typeof AwcPopoverElement;
  }
}
