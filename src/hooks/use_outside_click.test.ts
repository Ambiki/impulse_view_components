import type { Boundary } from './use_outside_click';
import { ImpulseElement, registerElement, whenInitialized } from '@ambiki/impulse';
import { expect, fixture, html } from '@open-wc/testing';
import useOutsideClick from './use_outside_click';

/** The smallest element the hook can be attached to: it only needs the impulse lifecycle. */
@registerElement('outside-click-host')
class OutsideClickHost extends ImpulseElement {}

/** A host with a button in it, next to a button outside it. */
async function outsideClickFixture() {
  const container = await fixture<HTMLElement>(html`
    <div>
      <outside-click-host><button data-name="inside">Inside</button></outside-click-host>
      <button data-name="outside">Outside</button>
    </div>
  `);
  const host = container.querySelector<OutsideClickHost>('outside-click-host')!;
  await whenInitialized(host);
  return {
    container,
    host,
    inside: container.querySelector<HTMLElement>('[data-name="inside"]')!,
    outside: container.querySelector<HTMLElement>('[data-name="outside"]')!,
  };
}

/** Attaches the hook to `host`, and records each call to its callback. */
function listen(host: OutsideClickHost, boundaries: Boundary[]) {
  const calls: Array<{ event: Event; target: HTMLElement }> = [];
  useOutsideClick(host, { boundaries, callback: (event, target) => calls.push({ event, target }) });
  return calls;
}

/**
 * Names what each call landed on by its `data-name`. A failed assertion on the elements themselves, or on the events,
 * stalls the test runner as it serializes them.
 */
function targets(calls: Array<{ target: HTMLElement }>) {
  return calls.map(({ target }) => target.dataset.name);
}

/** Fires a click on `element`, as a browser does at the end of a press, and returns it. */
function click(element: Element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
  element.dispatchEvent(event);
  return event;
}

/** Prevents the next click before the hook sees it, the way another outside click handler claims a click. */
function claimNextClick() {
  window.addEventListener('click', (event) => event.preventDefault(), { capture: true, once: true });
}

/** Presses `element` with the primary button, then fires the click on `release`, `element` itself by default. */
function press(element: Element, release: Element = element) {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
  return click(release);
}

describe('useOutsideClick', () => {
  it('calls back with the click and the pressed element when a press lands outside every boundary', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    const event = press(outside);

    expect(targets(calls)).to.eql(['outside']);
    expect(calls[0].event === event, 'calls back with the click').to.equal(true);
  });

  it('skips a press inside a boundary', async () => {
    const { host, inside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    press(inside);

    expect(targets(calls)).to.eql([]);
  });

  it('skips a press inside a shadow root in a boundary', async () => {
    const { host } = await outsideClickFixture();
    const shadowHost = host.appendChild(document.createElement('div'));
    const span = shadowHost.attachShadow({ mode: 'open' }).appendChild(document.createElement('span'));
    const calls = listen(host, [host]);

    press(span);

    expect(targets(calls)).to.eql([]);
  });

  it('judges a press by where it started, not by where its click lands', async () => {
    const { container, host, inside, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    // Released elsewhere, the click lands on what the press and the release have in common.
    press(inside, container);
    expect(targets(calls)).to.eql([]);

    press(outside, container);
    expect(targets(calls)).to.eql(['outside']);
  });

  it('skips a click without a press, such as one from Enter', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    click(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('skips a click that another handler has claimed by preventing it', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);
    claimNextClick();

    press(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('forgets a press once its click has been claimed, so a later click without a press is skipped', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);
    claimNextClick();

    press(outside);
    click(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('skips a press with a button other than the primary one, which ends in no click', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    // The middle button.
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 1 }));
    click(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('skips a press that opens the context menu, such as ctrl+click on macOS, which ends in no click', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, ctrlKey: true }));
    outside.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, ctrlKey: true }));
    click(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('skips a press that starts a drag, which ends in no click', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    outside.dispatchEvent(new DragEvent('dragstart', { bubbles: true, composed: true }));
    click(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('counts a press dispatched as a plain `Event`, which has no button', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    outside.dispatchEvent(new Event('mousedown', { bubbles: true, composed: true }));
    click(outside);

    expect(targets(calls)).to.eql(['outside']);
  });

  it('skips a press on an element removed before its click', async () => {
    const { container, host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    outside.remove();
    click(container);

    expect(targets(calls)).to.eql([]);
  });

  it('ignores a boundary that is `null`, such as an element a query did not find', async () => {
    const { host, inside, outside } = await outsideClickFixture();
    const calls = listen(host, [null, host]);

    press(inside);
    press(outside);

    expect(targets(calls)).to.eql(['outside']);
  });

  it('stops listening once the element disconnects', async () => {
    const { host, outside } = await outsideClickFixture();
    const calls = listen(host, [host]);

    host.remove();
    press(outside);

    expect(targets(calls)).to.eql([]);
  });
});
