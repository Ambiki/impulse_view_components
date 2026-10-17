import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';
import scrollLock from 'src/helpers/scroll_lock';

@registerElement('awc-dialog')
export default class AwcDialogElement extends ImpulseElement {
  /**
   * Whether the dialog is open or not. To make the dialog open by default, set it to `true`.
   */
  @property({ type: Boolean }) open = false;

  /**
   * Whether or not to hide the dialog when clicking outside of its region.
   */
  @property({ type: Boolean }) hideOnOutsideClick = true;

  @target() dialog: HTMLDialogElement;

  private _scrollLockController?: AbortController;

  /**
   * Called when the element is added to the DOM.
   */
  connected() {
    // Starting out open isn't a change, so it emits nothing.
    if (this.open) {
      this.showWithoutEmitting();
    }
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnected() {
    // Removal emits nothing: there is no dialog left to react to.
    this.hideWithoutEmitting();
  }

  /**
   * Shows the dialog as if the user asked to. Emits a cancelable `show`, and does nothing if it is prevented.
   */
  requestShow() {
    if (this.open || !this.emitRequest('show')) return;
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
    if (!this.open || !this.emitRequest('hide')) return;
    this.hide();
  }

  /**
   * Shows the dialog element. Emits `shown` but no `show`: use `requestShow` to let listeners prevent it.
   */
  show() {
    if (this.open) return;
    this.showWithoutEmitting();
    this.emit('shown');
  }

  /**
   * Hides the dialog element. Emits `hidden` but no `hide`: use `requestHide` to let listeners prevent it.
   */
  hide() {
    if (!this.open) return;
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
      // Closing the parent dialog when nested dialogs are still open will break the UI.
      this.nestedDialog?.hideWithoutEmitting();
      this.dialog.close();
    }
    this.showOverflow();
    this.open = false;
  }

  private showWithoutEmitting() {
    this.dialog.showModal();
    this.hideOverflow();
    this.open = true;
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
