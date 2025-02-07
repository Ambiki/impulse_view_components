import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import type { Placement, Strategy } from '@floating-ui/dom';
import '@oddbird/popover-polyfill';
import { isLooselyFocusable } from 'src/helpers/focus';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { stripCSSUnit } from '../../helpers/string';

const popovers = new Set<AwcPopoverElement>();

@registerElement('awc-popover')
export default class AwcPopoverElement extends ImpulseElement {
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
        if (this.open && !this.hasNestedOpenPopovers) {
          this.hide();
          // Prevent modals from closing accidentally.
          if (!isLooselyFocusable(target)) {
            event.preventDefault();
            this.button.focus();
          }
        }
      },
    });
  }

  disconnected() {
    this.hide();
  }

  async handleToggle() {
    if (this.open) {
      popovers.add(this);
      this.closeOtherPopovers();
      this.emit('show');
      this.button.setAttribute('aria-expanded', 'true');
      this.floatingUI.start();
      this.emit('shown');
    } else {
      this.emit('hide');
      this.button.setAttribute('aria-expanded', 'false');
      await this.floatingUI.stop();
      popovers.delete(this);
      this.emit('hidden');
    }
  }

  toggle() {
    this.panel.togglePopover();
  }

  show() {
    if (this.open) return;
    this.panel.showPopover();
  }

  hide(event?: Event) {
    if (!this.open) return;
    this.panel.hidePopover();

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

  async reposition() {
    await this.floatingUI.update();
  }

  private closeOtherPopovers() {
    for (const popover of popovers) {
      if (popover === this || popover.contains(this)) continue;
      popover.hide();
    }
  }

  private get hasNestedOpenPopovers() {
    const popover = [...popovers].find((p) => p === this);
    if (!popover) return false;
    const childPopovers = Array.from(popover.querySelectorAll<AwcPopoverElement>(this.identifier));
    return childPopovers.some((childPopover) => popovers.has(childPopover));
  }

  private get arrowPadding() {
    const borderRadius = getComputedStyle(this.panel).borderRadius;
    return stripCSSUnit(borderRadius) || 2;
  }

  private get boundaries() {
    const elements = this.clickBoundaries.map((s) => document.querySelector<HTMLElement>(s));
    return elements.concat([this.button, this.panel]);
  }

  get open(): boolean {
    if (!this.panel) return false;
    try {
      return this.panel.matches(':popover-open');
    } catch {
      return this.panel.matches('.\\:popover-open');
    }
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
