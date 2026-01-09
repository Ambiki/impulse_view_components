import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import type { Placement, Strategy } from '@floating-ui/dom';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { stripCSSUnit } from '../../helpers/string';

@registerElement('awc-popover')
export default class AwcPopoverElement extends ImpulseElement {
  /**
   * When the popover is open or not. To make the popover open by default, set it to `true`.
   * Make sure you aren't opening multiple popovers on page load, as this may degrade the user experience.
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
  @target() panel: HTMLDialogElement;
  @target() arrow: HTMLElement;

  private floatingUI: UseFloatingUIType;

  /**
   * Called when the element is added to the DOM.
   */
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
      callback: () => {
        // Only proceed if element is open and nested popovers are hidden.
        if (this.open && !this.hasNestedOpenPopovers) {
          this.hide();
        }
      },
    });

    if (this.open) {
      this.show();
    }
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnected() {
    this.hide();
  }

  async handleToggle() {
    if (this.open) {
      this.emit('hide');
      await this.hide();
      this.emit('hidden');
    } else {
      this.emit('show');
      this.show();
      this.emit('shown');
    }
  }

  /**
   * Shows/hides the popover.
   */
  toggle() {
    this.panel.togglePopover();
  }

  /**
   * Shows the popover.
   */
  show() {
    if (this.open) return;
    this.closeOtherPopovers();
    this.open = true;
    this.panel.show();
    this.button.setAttribute('aria-expanded', 'true');
    this.floatingUI.start();
  }

  /**
   * Hides a popover.
   */
  async hide(event?: Event): Promise<void> {
    if (!this.open) return;
    this.open = false;
    this.panel.close();
    await this.floatingUI.stop();
    this.button.setAttribute('aria-expanded', 'false');

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
          this.hide();
          this.button.focus();
        }
        break;
      }
    }
  }

  /**
   * Repositions the popover.
   */
  async reposition(): Promise<void> {
    await this.floatingUI.update();
  }

  private closeOtherPopovers() {
    const popovers = Array.from(document.querySelectorAll<AwcPopoverElement>(this.identifier));
    for (const popover of popovers) {
      if (popover === this || popover.contains(this)) continue;
      popover.hide();
    }
  }

  private get hasNestedOpenPopovers(): boolean {
    return Array.from(this.querySelectorAll<AwcPopoverElement>(this.identifier)).some((popover) => popover.open);
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
