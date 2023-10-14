import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';

@registerElement('awc-dialog')
export default class AwcDialogElement extends ImpulseElement {
  /**
   * The `id` of the trigger element (generally the open button).
   */
  @property() triggerId: string;

  /**
   * Whether or not to hide the dialog when clicking outside of its region.
   */
  @property({ type: Boolean }) hideOnOutsideClick = true;

  @target() dialog: HTMLDialogElement;

  private controller = new AbortController();

  connected() {
    if (this.trigger) {
      this.trigger.addEventListener('click', this.handleTriggerClick.bind(this), { signal: this.controller.signal });
    }
  }

  disconnected() {
    this.hide();
    this.controller.abort();
  }

  private handleTriggerClick() {
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.show();
  }

  // `close` event is not cancelable.
  // See: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close_event
  handleClose() {
    this.trigger?.setAttribute('aria-expanded', 'false');

    // If the parent dialog is still open, do not remove the styles.
    if (!this.closest('dialog[open]')) {
      document.body.style.removeProperty('padding-right');
      document.body.style.removeProperty('overflow');
    }
  }

  show() {
    this.dialog.showModal();
    document.body.style.paddingRight = `${window.innerWidth - document.body.clientWidth}px`;
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.dialog.close();
  }

  handleOutsideClick(event: MouseEvent) {
    if (!this.hideOnOutsideClick || event.defaultPrevented) return;
    const target = event.target;
    // Fix for nested dialogs.
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

  get trigger() {
    return document.getElementById(this.triggerId);
  }

  get open() {
    return this.dialog.open;
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
