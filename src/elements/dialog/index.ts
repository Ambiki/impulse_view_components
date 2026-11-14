import { on, property, registerElement, target } from '@ambiki/impulse';
import OpenableElement from 'src/internal/openable_element';
import scrollLock from 'src/internal/scroll_lock';

@registerElement('awc-dialog')
export default class AwcDialogElement extends OpenableElement {
  /**
   * Whether the dialog is open. Setting it shows or hides the dialog, as `show` and `hide` do.
   */
  @property({ type: Boolean }) open = false;

  /**
   * Whether a press outside the dialog, released outside it, asks it to close.
   */
  @property({ type: Boolean }) hideOnOutsideClick = true;

  @target() dialog: HTMLDialogElement;

  private _scrollLockController?: AbortController;

  private listeners?: AbortController;

  /** Whether the latest press started on the backdrop, until its click. */
  private pressedBackdrop = false;

  /**
   * Called when the element is added to the DOM.
   */
  connected() {
    this.listeners = new AbortController();
    // Captured, so that a handler in the dialog that stops the press can't keep it from being recorded.
    on('mousedown', this.localName, this.recordPress, { capture: true, signal: this.listeners.signal });
    super.connected();
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnected() {
    super.disconnected();
    this.listeners?.abort();
    this.pressedBackdrop = false;
  }

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
    // A click ends its press, so that a later click without one, such as from `click()`, isn't taken for it.
    const pressedBackdrop = this.pressedBackdrop;
    this.pressedBackdrop = false;
    if (!this.hideOnOutsideClick || event.defaultPrevented) return;
    // As with a native dialog's light dismiss, the press and the release both land on the backdrop. A press inside
    // released on the backdrop, such as to select text, lands its click there too.
    if (!pressedBackdrop || !this.isOnBackdrop(event)) return;

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

  private recordPress = (event: MouseEvent) => {
    if (event.currentTarget !== this) return;
    // A press with a button other than the primary one ends in no click, so it would linger.
    this.pressedBackdrop = event.button === 0 && this.isOnBackdrop(event);
  };

  /**
   * Whether `event` landed on the backdrop: on the `<dialog>` itself, outside its box. Only the top most dialog in the
   * stack has its backdrop under the pointer, so a nested dialog's backdrop doesn't count for this one.
   */
  private isOnBackdrop(event: MouseEvent) {
    if (event.target !== this.dialog) return false;
    const rect = this.dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
    );
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
