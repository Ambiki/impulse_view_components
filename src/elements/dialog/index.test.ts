import type AwcDialogElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture, nextFrame } from '@open-wc/testing';
import { Idiomorph } from 'idiomorph';
// Registers `awc-dialog`. Kept separate from the type import above, which the bundler elides.
import './index';

/**
 * Mirrors the structure of `app/components/impulse/dialog_component.html.erb` and its header's close button. Only the
 * parts the element reads are reproduced here: the target and the actions.
 */
function dialogHtml(attributes = '', body = '') {
  return `
    <awc-dialog ${attributes}>
      <dialog
        data-target="awc-dialog.dialog"
        data-action="click->awc-dialog#handleClick keydown->awc-dialog#handleKeydown cancel->awc-dialog#handleCancel close->awc-dialog#handleClose"
      >
        <button type="button" class="close" data-action="click->awc-dialog#requestHide">Close</button>
        <form method="dialog"><button class="submit">Done</button></form>
        ${body}
      </dialog>
    </awc-dialog>
  `;
}

async function dialogFixture(attributes = '') {
  const el = await fixture<AwcDialogElement>(dialogHtml(attributes));
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

  it('opens modally and closes when `open` changes, emitting only the state events', async () => {
    const el = await dialogFixture();
    const events = recordEvents(el);
    preventNext(el, 'show');
    preventNext(el, 'hide');

    el.open = true;
    expect(el.dialog.matches(':modal')).to.equal(true);

    el.removeAttribute('open');
    await settle();

    expect(el.dialog.open).to.equal(false);
    expect(events).to.eql(['shown', 'hidden']);
  });

  it('stays closed, and can be shown later, when opening fails', async () => {
    const el = await dialogFixture();
    // Already open without being modal, so `showModal()` throws.
    el.dialog.setAttribute('open', '');
    const events = recordEvents(el);

    expect(() => el.show()).to.throw();
    expect(el.open).to.equal(false);

    el.dialog.removeAttribute('open');
    el.show();

    expect(el.dialog.matches(':modal')).to.equal(true);
    expect(events).to.eql(['shown']);
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

  it('closes silently when removed, keeping `open`', async () => {
    const el = await dialogFixture();
    el.show();
    const { dialog } = el;
    const events = recordEvents(el);

    el.remove();
    await settle();

    expect(el.open).to.equal(true);
    expect(dialog.open).to.equal(false);
    expect(events).to.eql([]);
  });

  it('opens again silently when reconnected', async () => {
    const el = await dialogFixture();
    const parent = el.parentElement!;
    el.show();
    el.remove();
    await settle();
    const events = recordEvents(el);

    parent.append(el);
    await whenInitialized(el);

    expect(el.dialog.matches(':modal')).to.equal(true);
    expect(events).to.eql([]);
  });

  it('stays closed when hidden while removed', async () => {
    const el = await dialogFixture();
    const parent = el.parentElement!;
    el.show();
    el.remove();
    await settle();
    const events = recordEvents(el);

    el.hide();
    parent.append(el);
    await whenInitialized(el);

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events).to.eql([]);
  });

  it('emits nothing when asked to hide while removed', async () => {
    const el = await dialogFixture();
    el.show();
    el.remove();
    await settle();
    const events = recordEvents(el);

    el.requestHide();

    expect(events).to.eql([]);
  });

  it('opens silently once it connects when shown before', async () => {
    const container = await fixture<HTMLElement>('<div></div>');
    container.innerHTML = dialogHtml();
    const el = container.querySelector('awc-dialog')!;
    const events = recordEvents(el);

    el.show();
    await whenInitialized(el);

    expect(el.dialog.matches(':modal')).to.equal(true);
    expect(events).to.eql([]);
  });

  it('hides its nested dialog when `open` is removed', async () => {
    const outer = await fixture<AwcDialogElement>(dialogHtml('', dialogHtml()));
    const inner = outer.querySelector('awc-dialog')!;
    await whenInitialized(outer);
    await whenInitialized(inner);
    outer.show();
    inner.show();
    const outerEvents = recordEvents(outer);
    const innerEvents = recordEvents(inner);

    outer.removeAttribute('open');
    await settle();

    expect(inner.open).to.equal(false);
    expect(inner.dialog.open).to.equal(false);
    expect(outer.dialog.open).to.equal(false);
    expect(innerEvents).to.eql(['hidden']);
    expect(outerEvents).to.eql(['hidden']);
  });

  it('removes `open` without emitting from `hideWithoutEmitting`', async () => {
    const el = await dialogFixture();
    el.show();
    const events = recordEvents(el);

    el.hideWithoutEmitting();
    await settle();

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events).to.eql([]);
  });

  it('keeps its defaults through a morph to markup without them', async () => {
    const el = await dialogFixture();

    Idiomorph.morph(el, dialogHtml());

    expect(el.hideOnOutsideClick).to.equal(true);
  });

  it('falls back to its defaults when a morph removes their attributes', async () => {
    const el = await dialogFixture('hide-on-outside-click="false"');
    expect(el.hideOnOutsideClick).to.equal(false);

    Idiomorph.morph(el, dialogHtml());

    expect(el.hideOnOutsideClick).to.equal(true);
  });
});
