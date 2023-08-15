import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';

@registerElement('awc-dialog')
export default class AwcDialogElement extends ImpulseElement {
  @property() triggerId: string;
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
  handleClose(event: Event) {
    if (event.target !== this.dialog) return;
    this.trigger?.setAttribute('aria-expanded', 'false');
  }

  show() {
    this.dialog.showModal();
  }

  hide(event?: Event) {
    if (event) {
      event.stopPropagation();
      const target = event.target as HTMLElement;
      // Fix for nested dialogs.
      if (target.closest(this.identifier) !== this) {
        return;
      }
    }

    this.dialog.close();
  }

  checkBodyScroll(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    this.toggleAttribute('data-scroll', !!target.scrollTop);
  }

  handleOutsideClick(event: MouseEvent) {
    if (!this.hideOnOutsideClick) return;
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
