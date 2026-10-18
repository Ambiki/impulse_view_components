import { property, registerElement, target } from '@ambiki/impulse';
import scrollLock from 'src/helpers/scroll_lock';
import OpenableElement from 'src/internal/openable_element';

@registerElement('awc-dialog')
export default class AwcDialogElement extends OpenableElement {
  /**
   * Whether the dialog is open. Setting it shows or hides the dialog, as `show` and `hide` do.
   */
  @property({ type: Boolean }) open = false;

  /**
   * Whether or not to hide the dialog when clicking outside of its region.
   */
  @property({ type: Boolean }) hideOnOutsideClick = true;

  @target() dialog: HTMLDialogElement;

  private _scrollLockController?: AbortController;

  /**
   * Hides the dialog element, and the dialog nested in it first. Emits `hidden` but no `hide`: use `requestHide` to let
   * listeners prevent it.
   */
  hide(event?: Event): Promise<void> {
    if (this.opened) {
      this.nestedDialog?.hide();
    }
    return super.hide(event);
  }

  handleClick(event: MouseEvent) {
    if (!this.hideOnOutsideClick || event.defaultPrevented) return;
    const target = event.target;
    // Only close the top most dialog in the stack.
    if (!(target instanceof HTMLElement) || target !== this.dialog) return;
    const rect = target.getBoundingClientRect();
    if (
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width
    ) {
      return;
    }

    this.requestHide();
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Avoid parent popovers from being closed.
      event.stopPropagation();
    }
  }

  /**
   * Handles the `cancel` event a browser sends on Escape: the dialog closes only if the `hide` it emits isn't
   * prevented.
   * @private
   */
  handleCancel(event: Event) {
    // Browsers let a page cancel only the first Escape after a user interaction. Past that, the dialog closes anyway
    // and `handleClose` reports it, so a `hide` here couldn't be honoured.
    if (!event.cancelable) return;
    event.preventDefault();
    this.requestHide();
  }

  /**
   * Handles the dialog closing without the element closing it, such as a `<form method="dialog">` submitting.
   * @private
   */
  handleClose() {
    // A close that the element started can arrive after it was shown again.
    if (this.dialog.open) return;
    this.hide();
  }

  /**
   * Hides the dialog element, and any dialog nested in it, without emitting events.
   */
  hideWithoutEmitting() {
    if (this.dialog.open) {
      this.nestedDialog?.hideWithoutEmitting();
    }
    this.closeQuietly();
    // After closing the dialog, so that `openChanged` finds nothing left to do.
    this.open = false;
  }

  /** Shows the dialog modally. */
  protected openParts() {
    this.dialog.showModal();
    this.hideOverflow();
  }

  /** Closes the dialog, and any dialog nested in it. */
  protected closeParts() {
    if (this.dialog.open) {
      // Closing the parent dialog when nested dialogs are still open will break the UI.
      this.nestedDialog?.closeQuietly();
      this.dialog.close();
    }
    this.showOverflow();
  }

  private hideOverflow() {
    this._scrollLockController = scrollLock(this);
  }

  private showOverflow() {
    this._scrollLockController?.abort();
  }

  private get nestedDialog() {
    return this.querySelector<AwcDialogElement>(this.identifier);
  }
}

export { AwcDialogElement };

declare global {
  interface Window {
    AwcDialogElement: typeof AwcDialogElement;
  }
  interface HTMLElementTagNameMap {
    'awc-dialog': AwcDialogElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-dialog:show': CustomEvent<Record<string, never>>;
    'awc-dialog:shown': CustomEvent<Record<string, never>>;
    'awc-dialog:hide': CustomEvent<Record<string, never>>;
    'awc-dialog:hidden': CustomEvent<Record<string, never>>;
  }
}
