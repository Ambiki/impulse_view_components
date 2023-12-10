import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import type { Placement, Strategy } from '@floating-ui/dom';
import { isLooselyFocusable } from 'src/helpers/focus';
import focusTrap from 'src/helpers/focus_trap';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { stripCSSUnit } from '../../helpers/string';

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
   * The value of the `position` CSS property.
   * @see https://floating-ui.com/docs/computePosition#strategy
   */
  @property() strategy: Strategy = 'fixed';

  /**
   * The CSS selector of the element that should avoid closing the popover when clicked inside.
   */
  @property({ type: Array }) clickBoundaries: string[] = [];

  @target() button: HTMLButtonElement;
  @target() panel: HTMLElement;
  @target() arrow: HTMLElement;

  private floatingUI: UseFloatingUIType;
  private _focusTrap?: AbortController;

  connected() {
    this.floatingUI = useFloatingUI(this, {
      referenceElement: this.button,
      popupElement: this.panel,
      arrowElement: this.arrow,
      arrowPadding: this.arrowPadding,
      placement: this.placement,
      strategy: this.strategy,
      offsetOptions: 8,
      flipOptions: {
        fallbackAxisSideDirection: 'end',
      },
    });

    useOutsideClick(this, {
      boundaries: this.boundaries,
      callback: (event: Event, target: HTMLElement) => {
        // Only proceed if element is open and nested popovers are hidden.
        if (
          this.open &&
          Array.from(this.querySelectorAll<AwcPopoverElement>(this.identifier)).filter((p) => p.open).length === 0
        ) {
          this.open = false;
          // Prevent modals from closing accidentally.
          if (!isLooselyFocusable(target)) {
            event.preventDefault();
            this.button.focus();
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
      this._focusTrap = focusTrap(this.panel, { boundaries: this.boundaries });
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
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (this.open) return;
    this.open = true;
  }

  hide(event?: Event) {
    if (!this.open) return;
    this.open = false;

    // This event originated from a button click.
    if (event) {
      this.button.focus();
    }
  }

  handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape': {
        const target = event.target as HTMLElement;
        const popover = target.closest<AwcPopoverElement>(this.identifier);
        if (popover !== this && popover?.open) return;
        if (this.open) {
          // prevent modals from accidentally closing.
          event.preventDefault();
          event.stopPropagation();
          this.open = false;
          this.button.focus();
        }
        break;
      }
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
  interface HTMLElementTagNameMap {
    'awc-popover': AwcPopoverElement;
  }
}
