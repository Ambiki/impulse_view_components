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
    if (this.open) {
      this.show();
    }
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnected() {
    this.hideWithoutEmitting();
  }

  /**
   * Shows the dialog element.
   */
  show() {
    this.dialog.showModal();
    this.hideOverflow();
    this.open = true;
  }

  /**
   * Hides the dialog element.
   *
   * @example
   * <awc-dialog>
   *   <dialog>
   *     <button type="button" data-action="click->awc-dialog#hide">Close</button>
   *   </dialog>
   * </awc-dialog>
   */
  hide() {
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

    this.hide();
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Avoid parent popovers from being closed.
      event.stopPropagation();
      this.emit('hidden');
    }
  }

  hideWithoutEmitting() {
    if (this.dialog.open) {
      this.dialog.close();
      // Closing the parent dialog when nested dialogs are still open will break the UI.
      this.nestedDialog?.hide();
    }
    this.showOverflow();
    this.open = false;
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
}
