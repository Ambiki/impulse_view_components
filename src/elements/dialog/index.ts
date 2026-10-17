import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import scrollLock from 'src/helpers/scroll_lock';

@registerElement('awc-dialog')
export default class AwcDialogElement extends ImpulseElement {
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

  /** Whether `connected` has run since the element last connected: until it has, the dialog target isn't wired up. */
  private initialized = false;

  /**
   * The state the element last opened or closed the dialog to. `open` differs from it while the element is handling a
   * change to `open`, and while the element isn't initialized.
   */
  private opened = false;

  /**
   * Called when the element is added to the DOM.
   */
  connected() {
    this.initialized = true;
    // Starting out open isn't a change, so it emits nothing.
    if (this.open) {
      this.showWithoutEmitting();
    }
  }

  /**
   * Shows or hides the dialog when `open` changes, as `show` and `hide` do.
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
    // Removal emits nothing, and keeps `open`, so the dialog opens again if it's reconnected.
    this.closeDialog();
  }

  /**
   * Shows the dialog as if the user asked to. Emits a cancelable `show`, and does nothing if it is prevented.
   */
  requestShow() {
    if (!this.initialized || this.opened || !this.emitRequest('show')) return;
    this.show();
  }

  /**
   * Hides the dialog as if the user asked to. Emits a cancelable `hide`, and does nothing if it is prevented.
   *
   * @example
   * <awc-dialog>
   *   <dialog>
   *     <button type="button" data-action="click->awc-dialog#requestHide">Close</button>
   *   </dialog>
   * </awc-dialog>
   */
  requestHide() {
    if (!this.opened || !this.emitRequest('hide')) return;
    this.hide();
  }

  /**
   * Shows the dialog element. Emits `shown` but no `show`: use `requestShow` to let listeners prevent it.
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
   * Hides the dialog element. Emits `hidden` but no `hide`: use `requestHide` to let listeners prevent it.
   */
  hide() {
    if (!this.opened) {
      // Nothing is open, such as while the element is removed, so there is only `open` to clear.
      this.open = false;
      return;
    }
    this.nestedDialog?.hide();
    this.hideWithoutEmitting();
    this.emit('hidden');
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
    this.closeDialog();
    // After closing the dialog, so that `openChanged` finds nothing left to do.
    this.open = false;
  }

  private showWithoutEmitting() {
    this.dialog.showModal();
    this.hideOverflow();
    this.opened = true;
    // After `opened`, so that `openChanged` finds nothing left to do.
    this.open = true;
  }

  /** Closes the dialog, and any dialog nested in it, leaving `open` as it is. */
  private closeDialog() {
    if (this.dialog.open) {
      // Closing the parent dialog when nested dialogs are still open will break the UI.
      this.nestedDialog?.closeDialog();
      this.dialog.close();
    }
    this.showOverflow();
    this.opened = false;
  }

  /** Emits the request event `name`, returning whether the dialog may go ahead. */
  private emitRequest(name: 'show' | 'hide') {
    return !this.emit(name, { cancelable: true }).defaultPrevented;
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
