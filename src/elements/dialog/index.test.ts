import type AwcDialogElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture, nextFrame } from '@open-wc/testing';
// Registers `awc-dialog`. Kept separate from the type import above, which the bundler elides.
import './index';

/**
 * Mirrors the structure of `app/components/impulse/dialog_component.html.erb` and its header's close button. Only the
 * parts the element reads are reproduced here: the target and the actions.
 */
async function dialogFixture(attributes = '') {
  const el = await fixture<AwcDialogElement>(`
    <awc-dialog ${attributes}>
      <dialog
        data-target="awc-dialog.dialog"
        data-action="click->awc-dialog#handleClick keydown->awc-dialog#handleKeydown cancel->awc-dialog#handleCancel close->awc-dialog#handleClose"
      >
        <button type="button" class="close" data-action="click->awc-dialog#requestHide">Close</button>
        <form method="dialog"><button class="submit">Done</button></form>
      </dialog>
    </awc-dialog>
  `);
  await whenInitialized(el);
  return el;
}

const EVENTS = ['show', 'shown', 'hide', 'hidden'] as const;

/** Records, in order, the `awc-dialog:*` open and close events `el` dispatches. */
function recordEvents(el: AwcDialogElement) {
  const events: string[] = [];
  for (const name of EVENTS) {
    el.addEventListener(`awc-dialog:${name}`, (event) => {
      if (event.target === el) events.push(name);
    });
  }
  return events;
}

/** Prevents the next `awc-dialog:<name>` event `el` dispatches. */
function preventNext(el: AwcDialogElement, name: 'show' | 'hide') {
  el.addEventListener(`awc-dialog:${name}`, (event) => event.preventDefault(), { once: true });
}

/** The `cancel` event a browser sends a modal dialog on Escape. */
function cancel(el: AwcDialogElement) {
  const event = new Event('cancel', { cancelable: true });
  el.dialog.dispatchEvent(event);
  return event;
}

/** Waits for the dialog's `close` event, which browsers dispatch asynchronously. */
async function settle() {
  await nextFrame();
  await nextFrame();
}

describe('awc-dialog', () => {
  it('emits only the state events when shown and hidden from code', async () => {
    const el = await dialogFixture();
    const events = recordEvents(el);
    preventNext(el, 'show');
    preventNext(el, 'hide');

    el.show();
    expect(el.dialog.open).to.equal(true);
    el.hide();
    await settle();

    expect(el.open).to.equal(false);
    expect(events).to.eql(['shown', 'hidden']);
  });

  it('stays closed when `show` is prevented', async () => {
    const el = await dialogFixture();
    const events = recordEvents(el);
    preventNext(el, 'show');

    el.requestShow();

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events).to.eql(['show']);
  });

  it('requests to hide from its close button', async () => {
    const el = await dialogFixture();
    el.requestShow();
    const events = recordEvents(el);
    preventNext(el, 'hide');

    el.querySelector<HTMLButtonElement>('.close')!.click();
    expect(el.dialog.open).to.equal(true);

    el.querySelector<HTMLButtonElement>('.close')!.click();
    await settle();

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events).to.eql(['hide', 'hide', 'hidden']);
  });

  it('requests to hide on Escape', async () => {
    const el = await dialogFixture();
    el.show();
    const events = recordEvents(el);
    preventNext(el, 'hide');

    const refused = cancel(el);
    expect(refused.defaultPrevented).to.equal(true);
    expect(el.dialog.open).to.equal(true);

    cancel(el);
    await settle();

    expect(el.open).to.equal(false);
    expect(events).to.eql(['hide', 'hide', 'hidden']);
  });

  it('emits no `hide` when the browser does not let Escape be cancelled', async () => {
    const el = await dialogFixture();
    el.show();
    const events = recordEvents(el);

    el.dialog.dispatchEvent(new Event('cancel', { cancelable: false }));

    expect(events).to.eql([]);
  });

  it('stays open when shown again right after hiding', async () => {
    const el = await dialogFixture();
    el.show();
    const events = recordEvents(el);

    el.hide();
    el.show();
    await settle();

    expect(el.open).to.equal(true);
    expect(el.dialog.open).to.equal(true);
    expect(events).to.eql(['hidden', 'shown']);
  });

  it('emits `hidden` when the browser closes it', async () => {
    const el = await dialogFixture();
    el.show();
    const events = recordEvents(el);

    el.querySelector<HTMLButtonElement>('.submit')!.click();
    await settle();

    expect(el.open).to.equal(false);
    expect(events).to.eql(['hidden']);
  });

  it('opens silently when it connects with `open` set', async () => {
    const events: string[] = [];
    for (const name of EVENTS) {
      document.addEventListener(`awc-dialog:${name}`, () => events.push(name), { once: true });
    }

    const el = await dialogFixture('open');

    expect(el.dialog.open).to.equal(true);
    expect(events).to.eql([]);
  });

  it('closes silently when removed', async () => {
    const el = await dialogFixture();
    el.show();
    const events = recordEvents(el);

    el.remove();
    await settle();

    expect(el.open).to.equal(false);
    expect(events).to.eql([]);
  });
});
