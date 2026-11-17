import type AwcDialogElement from './index';
import { fixture, recordEvents, whenSettled } from '@ambiki/impulse/testing';
import { Idiomorph } from 'idiomorph';
import { componentMarkup, markupDifferences } from '../../internal/test_markup';
import { nextFrames } from '../../internal/test_waits';
// Registers `awc-dialog`. Kept separate from the type import above, which the bundler elides.
import './index';

/**
 * Mirrors the structure of `app/components/impulse/internal/modal_dialog_component.html.erb` and its header's close
 * button. Only the parts the element reads are reproduced here: the target and the actions.
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

function dialogFixture(attributes = '') {
  return fixture<AwcDialogElement>(dialogHtml(attributes));
}

const EVENTS = ['awc-dialog:show', 'awc-dialog:shown', 'awc-dialog:hide', 'awc-dialog:hidden'] as const;

/** Records, in order, the open and close events `el` dispatches itself. */
function record(el: AwcDialogElement) {
  return recordEvents(el, EVENTS, { self: true });
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

/** Where a press or a release lands: the element under the pointer, at a point in the viewport. */
interface Point {
  element: Element;
  x: number;
  y: number;
}

/** A point on the backdrop, whose events land on the `<dialog>`. A modal dialog is centred, away from this corner. */
function onBackdrop(el: AwcDialogElement): Point {
  return { element: el.dialog, x: 1, y: 1 };
}

/** The centre of `element`, inside the dialog when `element` is in it. */
function centerOf(element: Element): Point {
  const rect = element.getBoundingClientRect();
  return { element, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Presses at `pressed`, and fires the click as a browser does on release at `released`. A press and a release on
 * different elements land their click on what the two have in common, so pass that as `released.element`.
 */
function press(pressed: Point, released: Point = pressed) {
  const init = { bubbles: true, cancelable: true, composed: true };
  pressed.element.dispatchEvent(new MouseEvent('mousedown', { ...init, clientX: pressed.x, clientY: pressed.y }));
  released.element.dispatchEvent(new MouseEvent('click', { ...init, clientX: released.x, clientY: released.y }));
}

/**
 * Records the `close` event of `el`'s `<dialog>`, which browsers dispatch asynchronously, whether or not `el` reports it.
 * Once it has come, whatever `el` emits for it has been recorded.
 */
function recordClose(el: AwcDialogElement) {
  return recordEvents(el.dialog, ['close'], { self: true });
}

/**
 * Gives a `close` event the time to arrive, for a test where none should. No event comes either way to wait on instead.
 */
function noCloseEvent() {
  return nextFrames(2);
}

describe('awc-dialog', () => {
  describe('the markup these tests write', () => {
    it('has the targets, actions and roles the component renders', async () => {
      expect(markupDifferences(dialogHtml(), await componentMarkup('dialog'))).to.eql([]);
    });
  });

  it('emits only the state events when shown and hidden from code', async () => {
    const el = await dialogFixture();
    const events = record(el);
    const closed = recordClose(el);
    preventNext(el, 'show');
    preventNext(el, 'hide');

    el.show();
    expect(el.dialog.open).to.equal(true);
    el.hide();
    await closed.waitFor('close');

    expect(el.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:shown', 'awc-dialog:hidden']);
  });

  it('opens modally and closes when `open` changes, emitting only the state events', async () => {
    const el = await dialogFixture();
    const events = record(el);
    const closed = recordClose(el);
    preventNext(el, 'show');
    preventNext(el, 'hide');

    el.open = true;
    expect(el.dialog.matches(':modal')).to.equal(true);

    el.removeAttribute('open');
    await closed.waitFor('close');

    expect(el.dialog.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:shown', 'awc-dialog:hidden']);
  });

  it('stays closed, and can be shown later, when opening fails', async () => {
    const el = await dialogFixture();
    // Already open without being modal, so `showModal()` throws.
    el.dialog.setAttribute('open', '');
    const events = record(el);

    expect(() => el.show()).to.throw();
    expect(el.open).to.equal(false);

    el.dialog.removeAttribute('open');
    el.show();

    expect(el.dialog.matches(':modal')).to.equal(true);
    expect(events.types).to.eql(['awc-dialog:shown']);
  });

  it('stays closed when `show` is prevented', async () => {
    const el = await dialogFixture();
    const events = record(el);
    preventNext(el, 'show');

    el.requestShow();

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:show']);
  });

  it('requests to hide from its close button', async () => {
    const el = await dialogFixture();
    el.requestShow();
    const events = record(el);
    const closed = recordClose(el);
    preventNext(el, 'hide');

    el.querySelector<HTMLButtonElement>('.close')!.click();
    expect(el.dialog.open).to.equal(true);

    el.querySelector<HTMLButtonElement>('.close')!.click();
    await closed.waitFor('close');

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:hide', 'awc-dialog:hide', 'awc-dialog:hidden']);
  });

  it('requests to hide on a press and release on the backdrop', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);
    const closed = recordClose(el);
    preventNext(el, 'hide');

    press(onBackdrop(el));
    expect(el.dialog.open).to.equal(true);

    press(onBackdrop(el));
    await closed.waitFor('close');

    expect(el.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:hide', 'awc-dialog:hide', 'awc-dialog:hidden']);
  });

  it('stays open when a press on the backdrop is released inside it', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);

    press(onBackdrop(el), { ...centerOf(el.querySelector('.close')!), element: el.dialog });
    await noCloseEvent();

    expect(el.open).to.equal(true);
    expect(events.types).to.eql([]);
  });

  it('stays open on a click on the backdrop without a press', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);

    const { x, y } = onBackdrop(el);
    el.dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    await noCloseEvent();

    expect(el.open).to.equal(true);
    expect(events.types).to.eql([]);
  });

  it('stays open when a press inside it is released on the backdrop', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);

    press(centerOf(el.querySelector('.close')!), onBackdrop(el));
    await noCloseEvent();

    expect(el.open).to.equal(true);
    expect(events.types).to.eql([]);
  });

  it('requests to hide on Escape', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);
    const closed = recordClose(el);
    preventNext(el, 'hide');

    const refused = cancel(el);
    expect(refused.defaultPrevented).to.equal(true);
    expect(el.dialog.open).to.equal(true);

    cancel(el);
    await closed.waitFor('close');

    expect(el.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:hide', 'awc-dialog:hide', 'awc-dialog:hidden']);
  });

  it('emits no `hide` when the browser does not let Escape be cancelled', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);

    el.dialog.dispatchEvent(new Event('cancel', { cancelable: false }));

    expect(events.types).to.eql([]);
  });

  it('stays open when shown again right after hiding', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);
    const closed = recordClose(el);

    el.hide();
    el.show();
    await closed.waitFor('close');

    expect(el.open).to.equal(true);
    expect(el.dialog.open).to.equal(true);
    expect(events.types).to.eql(['awc-dialog:hidden', 'awc-dialog:shown']);
  });

  it('emits `hidden` when the browser closes it', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);

    el.querySelector<HTMLButtonElement>('.submit')!.click();
    await events.waitFor('awc-dialog:hidden');

    expect(el.open).to.equal(false);
    expect(events.types).to.eql(['awc-dialog:hidden']);
  });

  it('opens silently when it connects with `open` set', async () => {
    const events = recordEvents(document, EVENTS);

    const el = await dialogFixture('open');

    expect(el.dialog.open).to.equal(true);
    expect(events.types).to.eql([]);
  });

  it('closes silently when removed, keeping `open`', async () => {
    const el = await dialogFixture();
    el.show();
    const { dialog } = el;
    const events = record(el);
    const closed = recordClose(el);

    el.remove();
    await closed.waitFor('close');

    expect(el.open).to.equal(true);
    expect(dialog.open).to.equal(false);
    expect(events.types).to.eql([]);
  });

  it('opens again silently when reconnected', async () => {
    const el = await dialogFixture();
    const parent = el.parentElement!;
    el.show();
    const closed = recordClose(el);
    el.remove();
    await closed.waitFor('close');
    const events = record(el);

    parent.append(el);
    await whenSettled();

    expect(el.dialog.matches(':modal')).to.equal(true);
    expect(events.types).to.eql([]);
  });

  it('stays closed when hidden while removed', async () => {
    const el = await dialogFixture();
    const parent = el.parentElement!;
    el.show();
    const closed = recordClose(el);
    el.remove();
    await closed.waitFor('close');
    const events = record(el);

    el.hide();
    parent.append(el);
    await whenSettled();

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events.types).to.eql([]);
  });

  it('emits nothing when asked to hide while removed', async () => {
    const el = await dialogFixture();
    el.show();
    const closed = recordClose(el);
    el.remove();
    await closed.waitFor('close');
    const events = record(el);

    el.requestHide();

    expect(events.types).to.eql([]);
  });

  it('opens silently once it connects when shown before', async () => {
    const container = await fixture<HTMLElement>('<div></div>');
    container.innerHTML = dialogHtml();
    const el = container.querySelector('awc-dialog')!;
    const events = record(el);

    el.show();
    await whenSettled();

    expect(el.dialog.matches(':modal')).to.equal(true);
    expect(events.types).to.eql([]);
  });

  it('hides its nested dialog when `open` is removed', async () => {
    const outer = await fixture<AwcDialogElement>(dialogHtml('', dialogHtml()));
    const inner = outer.querySelector('awc-dialog')!;
    outer.show();
    inner.show();
    const outerEvents = record(outer);
    const innerEvents = record(inner);
    const outerClosed = recordClose(outer);
    const innerClosed = recordClose(inner);

    outer.removeAttribute('open');
    await innerClosed.waitFor('close');
    await outerClosed.waitFor('close');

    expect(inner.open).to.equal(false);
    expect(inner.dialog.open).to.equal(false);
    expect(outer.dialog.open).to.equal(false);
    expect(innerEvents.types).to.eql(['awc-dialog:hidden']);
    expect(outerEvents.types).to.eql(['awc-dialog:hidden']);
  });

  it('removes `open` without emitting from `hideWithoutEmitting`', async () => {
    const el = await dialogFixture();
    el.show();
    const events = record(el);
    const closed = recordClose(el);

    el.hideWithoutEmitting();
    await closed.waitFor('close');

    expect(el.open).to.equal(false);
    expect(el.dialog.open).to.equal(false);
    expect(events.types).to.eql([]);
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
