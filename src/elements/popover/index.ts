import type { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import type { Placement, Strategy } from 'src/internal/positioning';
import { property, registerElement, target } from '@ambiki/impulse';
import useFloatingUI from 'src/hooks/use_floating_ui';
import useFocusOut from 'src/hooks/use_focus_out';
import useOutsideClick from 'src/hooks/use_outside_click';
import { focusInto, focusIsInsideOrLost, keepFocusOn } from 'src/internal/focus';
import OpenableElement from 'src/internal/openable_element';
import { stripCSSUnit } from '../../helpers/string';

@registerElement('awc-popover')
export default class AwcPopoverElement extends OpenableElement {
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
  @target() panel: HTMLElement;
  @target() arrow: HTMLElement;

  private floatingUI: UseFloatingUIType;

  /**
   * Whether the popover is opening. The focus it moves meanwhile isn't focus leaving it: the other open popovers it hides
   * return focus to their triggers, and focus then moves into this one, or back to where it was when it connects open.
   */
  private opening = false;

  /**
   * Called when the element is added to the DOM.
   */
  connected() {
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

    useFocusOut(this, {
      boundaries: this.boundaries,
      callback: () => {
        if (this.open && !this.opening) {
          this.requestHide();
        }
      },
    });

    super.connected();
  }

  placementChanged() {
    this.reposition();
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
   * Hides the popover, and the popovers nested in it first. Emits `hidden` but no `hide`: use `requestHide` to let
   * listeners prevent it.
   */
  hide(event?: Event): Promise<void> {
    // A nested popover floats in the top layer on its own, so it would stay behind. Each one reports its own close.
    if (this.opened) {
      for (const popover of this.nestedOpenPopovers) {
        popover.hide();
      }
    }
    return super.hide(event);
  }

  /**
   * Repositions the popover.
   */
  async reposition(): Promise<void> {
    await this.floatingUI.update();
  }

  /** Shows the panel in the top layer, hiding the other open popovers, and moves focus into it. */
  protected openParts({ initial }: { initial: boolean }) {
    this.opening = true;
    try {
      this.closeOtherPopovers();
      const previouslyFocused = document.activeElement;
      this.panel.showPopover();
      if (!initial) {
        focusInto(this.panel);
      } else if (this.panel.contains(document.activeElement)) {
        // Starting out open isn't a change, so it doesn't take focus, although the browser moves it to an `autofocus`
        // element.
        keepFocusOn(previouslyFocused);
      }
    } finally {
      this.opening = false;
    }
    this.button.setAttribute('aria-expanded', 'true');
    this.floatingUI.start();
  }

  /** Closes the panel. */
  protected async closeParts() {
    // Taken before awaiting: when hiding because the popover was removed, its targets are gone by the time `stop`
    // resolves.
    const button = this.button;
    const panel = this.panel;
    // A removed popover has already left the top layer, and hiding it again would throw.
    if (panel.isConnected) {
      // Read before hiding, which moves focus out of the panel.
      const returnsFocus = focusIsInsideOrLost(panel);
      panel.hidePopover();
      if (returnsFocus) {
        button.focus();
      }
    }
    await this.floatingUI.stop();
    // Shown again while stopping: the trigger already says so.
    if (this.opened) return;
    button.setAttribute('aria-expanded', 'false');
  }

  /** Showing the popover hides the other open popovers, so each of them is asked to hide first. */
  protected othersAllowShow() {
    return this.otherOpenPopovers.every((popover) => popover.emitRequest('hide'));
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

  private get nestedOpenPopovers() {
    return Array.from(this.querySelectorAll<AwcPopoverElement>(this.identifier)).filter((popover) => popover.open);
  }

  private get hasNestedOpenPopovers(): boolean {
    return this.nestedOpenPopovers.length > 0;
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
