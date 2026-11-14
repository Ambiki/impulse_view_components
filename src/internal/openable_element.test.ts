import { property, registerElement, whenInitialized } from '@ambiki/impulse';
import { expect, fixture, html } from '@open-wc/testing';
import OpenableElement from './openable_element';

/** The smallest openable element: it records what the base class calls, in order, along with the events it emits. */
@registerElement('openable-host')
class OpenableHost extends OpenableElement {
  @property({ type: Boolean }) open = false;

  log: string[] = [];

  /** What `closeParts` returns: a promise makes closing take time. */
  closing?: Promise<void>;

  protected openParts({ initial }: { initial: boolean }) {
    this.log.push(initial ? 'openParts(initial)' : 'openParts');
  }

  protected closeParts() {
    this.log.push('closeParts');
    return this.closing;
  }

  protected hideNested() {
    this.log.push('hideNested');
  }

  protected afterHidden() {
    this.log.push('afterHidden');
  }
}

const EVENTS = ['show', 'shown', 'hide', 'hidden'] as const;

/** An initialized host, whose log also takes the open and close events it emits from here on. */
async function openableFixture(attributes = '') {
  const container = await fixture<HTMLElement>(`<div><openable-host ${attributes}></openable-host></div>`);
  const el = container.querySelector<OpenableHost>('openable-host')!;
  await whenInitialized(el);
  for (const name of EVENTS) {
    el.addEventListener(`openable-host:${name}`, () => el.log.push(name));
  }
  return el;
}

/** Prevents the next `openable-host:<name>` event `el` emits. */
function preventNext(el: OpenableHost, name: 'show' | 'hide') {
  el.addEventListener(`openable-host:${name}`, (event) => event.preventDefault(), { once: true });
}

describe('OpenableElement', () => {
  it('opens its parts and emits only `shown` when shown from code', async () => {
    const el = await openableFixture();

    el.show();

    expect(el.open).to.equal(true);
    expect(el.log).to.eql(['openParts', 'shown']);
  });

  it('emits a `show` that can be prevented before it opens for a request', async () => {
    const el = await openableFixture();

    preventNext(el, 'show');
    el.requestShow();
    expect(el.open).to.equal(false);
    expect(el.log).to.eql(['show']);

    el.requestShow();
    expect(el.open).to.equal(true);
    expect(el.log).to.eql(['show', 'show', 'openParts', 'shown']);
  });

  it('hides what is nested in it, closes its parts, emits `hidden`, then does what follows, in that order', async () => {
    const el = await openableFixture('open');
    el.log = [];

    await el.hide();

    expect(el.open).to.equal(false);
    expect(el.log).to.eql(['hideNested', 'closeParts', 'hidden', 'afterHidden']);
  });

  it('emits a `hide` that can be prevented before it closes for a request', async () => {
    const el = await openableFixture('open');
    el.log = [];

    preventNext(el, 'hide');
    await el.requestHide();
    expect(el.open).to.equal(true);
    expect(el.log).to.eql(['hide']);

    await el.requestHide();
    expect(el.open).to.equal(false);
    expect(el.log).to.eql(['hide', 'hide', 'hideNested', 'closeParts', 'hidden', 'afterHidden']);
  });

  it('closes once when `open` is removed, although removing it hides the element again', async () => {
    const el = await openableFixture('open');
    el.log = [];

    el.open = false;
    await Promise.resolve();

    expect(el.log).to.eql(['hideNested', 'closeParts', 'hidden', 'afterHidden']);
  });

  it('does nothing when shown while open', async () => {
    const el = await openableFixture('open');
    el.log = [];

    el.show();
    el.requestShow();

    expect(el.log).to.eql([]);
  });

  it('does nothing when hidden while closed', async () => {
    const el = await openableFixture();

    await el.hide();
    await el.requestHide();

    expect(el.log).to.eql([]);
  });

  it('opens its parts silently when it connects open', async () => {
    const container = await fixture<HTMLElement>(html`<div><openable-host open></openable-host></div>`);
    const el = container.querySelector<OpenableHost>('openable-host')!;
    const events: string[] = [];
    for (const name of EVENTS) el.addEventListener(`openable-host:${name}`, () => events.push(name));

    await whenInitialized(el);

    expect(el.log).to.eql(['openParts(initial)']);
    expect(events).to.eql([]);
  });

  it('closes its parts silently when removed, keeps `open`, and opens again when reconnected', async () => {
    const el = await openableFixture('open');
    const container = el.parentElement!;
    el.log = [];

    el.remove();
    expect(el.open).to.equal(true);
    expect(el.log).to.eql(['closeParts']);

    container.append(el);
    await whenInitialized(el);
    expect(el.log).to.eql(['closeParts', 'openParts(initial)']);
  });

  it('emits no `hidden`, and does not go on to what follows it, when shown again while closing', async () => {
    const el = await openableFixture('open');
    let closed!: () => void;
    el.closing = new Promise((resolve) => (closed = resolve));
    el.log = [];

    const hidden = el.hide();
    el.show();
    closed();
    await hidden;

    expect(el.open).to.equal(true);
    expect(el.log).to.eql(['hideNested', 'closeParts', 'openParts', 'shown']);
  });
});
