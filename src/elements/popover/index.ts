import type { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import type { Placement, Strategy } from 'src/internal/positioning';
import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import useFloatingUI from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { stripCSSUnit } from '../../helpers/string';

@registerElement('awc-popover')
export default class AwcPopoverElement extends ImpulseElement {
  /**
   * Whether the popover is open. Setting it shows or hides the popover, as `show` and `hide` do.
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

  /** Whether `connected` has run since the popover last connected: until it has, the targets aren't wired up. */
  private initialized = false;

  /**
   * The state the popover last opened or closed itself to. `open` differs from it while the popover is handling a
   * change to `open`, and while the popover isn't initialized.
   */
  private opened = false;

  /**
   * Called when the element is added to the DOM.
   */
  connected() {
    this.initialized = true;
    // Measured once: reading it on every reposition would force a style recalculation each time.
    const arrowPadding = this.arrowPadding;
    // Read on every reposition, so that `placement` and `strategy` follow their attributes. `placementChanged`
    // repositions straight away; a `strategy` change applies from the next reposition.
    this.floatingUI = useFloatingUI(this, () => ({
      anchorElement: this.button,
      floatingElement: this.panel,
      arrowElement: this.arrow,
      arrowPadding,
      placement: this.placement,
      strategy: this.strategy,
      offsetOptions: 8,
      flipOptions: {
        fallbackAxisSideDirection: 'end',
      },
    }));

    useOutsideClick(this, {
      boundaries: this.boundaries,
      callback: (_event, target) => {
        // Pressing a closed popover's trigger opens that popover, which asks this one to hide itself.
        if (this.isClosedPopoverTrigger(target)) return;
        // Only proceed if element is open and nested popovers are hidden.
        if (this.open && !this.hasNestedOpenPopovers) {
          this.requestHide();
        }
      },
    });

    // Starting out open isn't a change, so it emits nothing.
    if (this.open) {
      this.showWithoutEmitting();
    }
  }

  placementChanged() {
    this.reposition();
  }

  /**
   * Shows or hides the popover when `open` changes, as `show` and `hide` do.
   * @private
   */
  openChanged(open: boolean) {
    if (open) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnected() {
    this.initialized = false;
    // Removal emits nothing, and keeps `open`, so the popover opens again if it's reconnected.
    this.closePanel();
  }

  /**
   * Shows or hides the popover as if its trigger was clicked, emitting a cancelable `show` or `hide` first.
   */
  async toggle() {
    if (this.opened) {
      await this.requestHide();
    } else {
      this.requestShow();
    }
  }

  /**
   * Shows the popover as if the user asked to. Emits a cancelable `show`, then asks the other open popovers to hide
   * with a cancelable `hide` each. Does nothing if any of them is prevented.
   */
  requestShow() {
    if (!this.initialized || this.opened || !this.emitRequest('show')) return;
    for (const popover of this.otherOpenPopovers) {
      if (!popover.emitRequest('hide')) return;
    }
    this.show();
  }

  /**
   * Hides the popover as if the user asked to. Emits a cancelable `hide`, and does nothing if it is prevented.
   */
  async requestHide(event?: Event): Promise<void> {
    if (!this.opened || !this.emitRequest('hide')) return;
    await this.hide(event);
  }

  /**
   * Shows the popover and hides the other open popovers. Emits `shown` but no `show`: use `requestShow` to let
   * listeners prevent it.
   */
  show() {
    if (this.opened) return;
    if (!this.initialized) {
      // It opens, silently, once it connects.
      this.open = true;
      return;
    }
    this.showWithoutEmitting();
    this.emit('shown');
  }

  /**
   * Hides the popover. Emits `hidden` but no `hide`: use `requestHide` to let listeners prevent it.
   */
  async hide(event?: Event): Promise<void> {
    if (!this.opened) {
      // Nothing is open, such as while the popover is removed, so there is only `open` to clear.
      this.open = false;
      return;
    }
    const closed = this.closePanel(event);
    // After closing the panel, so that `openChanged` finds nothing left to do.
    this.open = false;
    await closed;
    // Shown again before the hide finished, so there is no close left to report.
    if (!this.opened) {
      this.emit('hidden');
    }
  }

  /**
   * Handles the panel closing without the popover closing it, such as a `<form method="dialog">` inside it submitting.
   * @private
   */
  handleClose(event: Event) {
    // A close that the popover started can arrive after it was shown again.
    if (this.panel.open) return;
    this.hide(event);
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
          this.requestHide(event);
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

  private showWithoutEmitting() {
    this.closeOtherPopovers();
    this.opened = true;
    // After `opened`, so that `openChanged` finds nothing left to do.
    this.open = true;
    this.panel.show();
    this.button.setAttribute('aria-expanded', 'true');
    this.floatingUI.start();
  }

  /** Closes the panel, leaving `open` as it is. */
  private async closePanel(event?: Event) {
    if (!this.opened) return;
    // Taken before awaiting: when hiding because the popover was removed, its targets are gone by the time `stop`
    // resolves.
    const button = this.button;
    this.opened = false;
    this.panel.close();
    await this.floatingUI.stop();
    // Shown again while stopping: the trigger already says so.
    if (this.opened) return;
    button.setAttribute('aria-expanded', 'false');

    // Closed by an event, such as a click on a close button, so focus goes back to the trigger.
    if (event) {
      button.focus();
    }
  }

  /** Emits the request event `name`, returning whether the popover may go ahead. */
  private emitRequest(name: 'show' | 'hide') {
    return !this.emit(name, { cancelable: true }).defaultPrevented;
  }

  private closeOtherPopovers() {
    for (const popover of this.otherOpenPopovers) {
      popover.hide();
    }
  }

  /** Whether `target` is in the trigger of another popover that is closed, so pressing it opens that popover. */
  private isClosedPopoverTrigger(target: HTMLElement) {
    const popover = target.closest<AwcPopoverElement>(this.identifier);
    return !!popover && popover !== this && !popover.open && popover.button.contains(target);
  }

  /** The open popovers that showing this one hides: every other one except its ancestors. */
  private get otherOpenPopovers() {
    return Array.from(document.querySelectorAll<AwcPopoverElement>(this.identifier)).filter(
      (popover) => popover !== this && !popover.contains(this) && popover.open,
    );
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
  interface GlobalEventHandlersEventMap {
    'awc-popover:hide': CustomEvent<Record<string, never>>;
    'awc-popover:hidden': CustomEvent<Record<string, never>>;
    'awc-popover:show': CustomEvent<Record<string, never>>;
    'awc-popover:shown': CustomEvent<Record<string, never>>;
  }
}
