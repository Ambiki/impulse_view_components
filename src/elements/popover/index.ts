import type { Placement } from '@floating-ui/dom';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useFocusTrap, { UseFocusTrap } from 'src/hooks/use_focus_trap';
import useOutsideClick from 'src/hooks/use_outside_click';
import { ImpulseElement, property, registerElement, target } from 'src/impulse';
import { stripCSSUnit } from 'src/impulse/helpers/string';

@registerElement('awc-popover')
export default class AwcPopoverElement extends ImpulseElement {
  @property({ type: Boolean }) open = false;
  @property() placement: Placement = 'bottom';

  @target() button: HTMLButtonElement;
  @target() panel: HTMLElement;
  @target() arrow?: HTMLElement;

  private floatingUI: UseFloatingUIType;
  private focusTrap: UseFocusTrap;

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
      boundaries: [this.button, this.panel],
      callback: () => {
        this.open = false;
      },
    });

    this.focusTrap = useFocusTrap(this, { trap: this.panel });

    // Don't start focus trap.
    if (this.open) {
      this.panel.hidden = false;
      this.button.setAttribute('aria-expanded', 'true');
      this.floatingUI.start();
    }
  }

  disconnected() {
    this.open = false;
  }

  async openChanged(newValue: boolean) {
    if (newValue) {
      this.panel.hidden = false;
      this.button.setAttribute('aria-expanded', 'true');
      this.floatingUI.start();
      this.focusTrap.start();
    } else {
      this.panel.hidden = true;
      this.button.setAttribute('aria-expanded', 'false');
      this.button.focus();
      await this.floatingUI.stop();
      this.focusTrap.stop();
    }
  }

  handleButtonClick() {
    if (this.button.hasAttribute('disabled') || this.button.getAttribute('aria-disabled') === 'true') return;
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

  async updatePosition() {
    await this.floatingUI.update();
  }

  private get arrowPadding() {
    const borderRadius = getComputedStyle(this.panel).borderRadius;
    return stripCSSUnit(borderRadius) || 2;
  }
}
