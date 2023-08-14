import { ImpulseElement, property, registerElement, target } from '@ambiki/impulse';

@registerElement('awc-dialog')
export default class AwcDialogElement extends ImpulseElement {
  @property() triggerId: string;
  @target() dialog: HTMLDialogElement;

  private controller = new AbortController();

  connected() {
    if (this.trigger) {
      this.trigger.addEventListener('click', this.handleTriggerClick.bind(this), { signal: this.controller.signal });
    }
  }

  disconnected() {
    this.controller.abort();
  }

  private handleTriggerClick() {
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.show();
  }

  handleClose() {
    this.trigger?.setAttribute('aria-expanded', 'false');
  }

  show() {
    this.dialog.showModal();
  }

  hide() {
    this.dialog.close();
  }

  checkBodyScroll(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    this.toggleAttribute('data-scroll', !!target.scrollTop);
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
