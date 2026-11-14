import type { Boundary } from './use_outside_click';
import { ImpulseElement, registerElement, whenInitialized } from '@ambiki/impulse';
import { aTimeout, expect, fixture, html } from '@open-wc/testing';
import useFocusOut from './use_focus_out';
import useOutsideClick from './use_outside_click';

/** The smallest element the hook can be attached to: it only needs the impulse lifecycle. */
@registerElement('focus-out-host')
class FocusOutHost extends ImpulseElement {}

/**
 * A host with two buttons in it, next to a button, and a label with its field, outside it. The container around them
 * all can take focus.
 */
async function focusOutFixture() {
  const container = await fixture<HTMLElement>(html`
    <div data-name="container" tabindex="-1">
      <focus-out-host>
        <button data-name="inside">Inside</button>
        <button data-name="also-inside">Also inside</button>
      </focus-out-host>
      <button data-name="outside"><span data-name="outside-text">Outside</span></button>
      <label data-name="label" for="focus-out-field">Field</label>
      <input id="focus-out-field" data-name="field" />
    </div>
  `);
  const host = container.querySelector<FocusOutHost>('focus-out-host')!;
  await whenInitialized(host);
  const named = (name: string) => container.querySelector<HTMLElement>(`[data-name="${name}"]`)!;
  return {
    container,
    host,
    inside: named('inside'),
    alsoInside: named('also-inside'),
    outside: named('outside'),
    outsideText: named('outside-text'),
    label: named('label'),
    field: named('field'),
  };
}

/** Attaches the hook to `host`, and records each call to its callback. */
function listen(host: FocusOutHost, boundaries: Boundary[]) {
  const calls: Array<{ event: FocusEvent; target: HTMLElement }> = [];
  useFocusOut(host, { boundaries, callback: (event, target) => calls.push({ event, target }) });
  return calls;
}

/**
 * Names what focus moved to in each call by its `data-name`. A failed assertion on the elements themselves, or on the
 * events, stalls the test runner as it serializes them.
 */
function targets(calls: Array<{ target: HTMLElement }>) {
  return calls.map(({ target }) => target.dataset.name);
}

/** Starts a press on `element`. A browser moves focus between this and the click, which the tests do with `focus()`. */
function pressDown(element: Element, init: PointerEventInit = {}) {
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, ...init }));
}

/** Finishes a press on `element` with its click, which comes after the focus the press moved. */
function click(element: Element) {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Attaches `useOutsideClick` to `host` as well, and records what each call to its callback landed on. */
function listenForOutsideClicks(host: FocusOutHost, boundaries: Boundary[]) {
  const pressed: Array<string | undefined> = [];
  useOutsideClick(host, { boundaries, callback: (_event, target) => pressed.push(target.dataset.name) });
  return pressed;
}

/** Appends an element with an open shadow root to `parent`, named `shadow-host`, and returns the input in that root. */
function appendShadowInput(parent: Element) {
  const shadowHost = parent.appendChild(document.createElement('div'));
  shadowHost.dataset.name = 'shadow-host';
  return shadowHost.attachShadow({ mode: 'open' }).appendChild(document.createElement('input'));
}

describe('useFocusOut', () => {
  it('calls back with the focusin event and the element focus moved to, outside every boundary', async () => {
    const { host, inside, outside } = await focusOutFixture();
    const calls = listen(host, [host]);
    inside.focus();
    let focusin: Event | undefined;
    outside.addEventListener('focusin', (event) => (focusin = event), { once: true });

    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
    expect(calls[0].event === focusin, 'calls back with the focusin event').to.equal(true);
  });

  it('calls back for a move outside when focus was not inside a boundary before', async () => {
    const { host, outside, field } = await focusOutFixture();
    const calls = listen(host, [host]);

    outside.focus();
    field.focus();

    expect(targets(calls)).to.eql(['outside', 'field']);
  });

  it('skips focus moving into a boundary, and within it', async () => {
    const { host, inside, alsoInside } = await focusOutFixture();
    const calls = listen(host, [host]);

    inside.focus();
    alsoInside.focus();

    expect(targets(calls)).to.eql([]);
  });

  it('skips focus moving from one boundary to another', async () => {
    const { host, inside, field } = await focusOutFixture();
    const calls = listen(host, [inside, field]);

    inside.focus();
    field.focus();

    expect(targets(calls)).to.eql([]);
  });

  it('ignores a boundary that is `null`, such as an element a query did not find', async () => {
    const { host, inside, outside } = await focusOutFixture();
    const calls = listen(host, [null, host]);

    inside.focus();
    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
  });

  it('skips focus falling back to `<body>` when the focused element is removed', async () => {
    const { host, inside } = await focusOutFixture();
    const calls = listen(host, [host]);
    inside.focus();

    inside.remove();

    expect(document.activeElement === document.body, 'focus fell back to `<body>`').to.equal(true);
    expect(targets(calls)).to.eql([]);
  });

  it('skips focus moved by a press outside to the element pressed', async () => {
    const { host, inside, outside } = await focusOutFixture();
    const calls = listen(host, [host]);
    inside.focus();

    pressDown(outside);
    outside.focus();

    expect(targets(calls)).to.eql([]);
  });

  it('skips focus moved by a press outside to the focusable element around the element pressed', async () => {
    const { host, inside, outside, outsideText } = await focusOutFixture();
    const calls = listen(host, [host]);
    inside.focus();

    pressDown(outsideText);
    outside.focus();

    expect(targets(calls)).to.eql([]);
  });

  it('calls back when a press inside moves focus out, as a button that opens something elsewhere does', async () => {
    const { host, inside, outside } = await focusOutFixture();
    const calls = listen(host, [host]);

    pressDown(inside);
    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
  });

  it('calls back when a press inside moves focus to an element around the boundary', async () => {
    const { container, host, inside } = await focusOutFixture();
    const calls = listen(host, [host]);

    pressDown(inside);
    container.focus();

    expect(targets(calls)).to.eql(['container']);
  });

  it('skips focus that the click of a press outside moves to the element pressed', async () => {
    const { host, inside, outside } = await focusOutFixture();
    const calls = listen(host, [host]);
    inside.focus();
    // As an element does that keeps a press from moving focus, and takes focus once it is clicked.
    outside.addEventListener('click', () => outside.focus(), { once: true });

    pressDown(outside);
    click(outside);

    expect(targets(calls)).to.eql([]);
  });

  it('leaves a press outside to `useOutsideClick`, so that the two hooks call back once between them', async () => {
    const { host, inside, outside } = await focusOutFixture();
    const calls = listen(host, [host]);
    const pressed = listenForOutsideClicks(host, [host]);
    inside.focus();

    pressDown(outside);
    outside.focus();
    click(outside);

    expect(targets(calls)).to.eql([]);
    expect(pressed).to.eql(['outside']);
  });

  it('calls back, as `useOutsideClick` does, when a press outside moves focus elsewhere, as on a label', async () => {
    const { host, inside, label, field } = await focusOutFixture();
    const calls = listen(host, [host]);
    const pressed = listenForOutsideClicks(host, [host]);
    inside.focus();

    pressDown(label);
    click(label);
    // A label moves focus to its field once it is clicked.
    field.focus();

    expect(targets(calls)).to.eql(['field']);
    expect(pressed).to.eql(['label']);
  });

  it('calls back when a press outside with another button moves focus, as a right click on a field does', async () => {
    const { host, inside, field } = await focusOutFixture();
    const calls = listen(host, [host]);
    const pressed = listenForOutsideClicks(host, [host]);
    inside.focus();

    // No click follows, so `useOutsideClick` never hears of the press.
    pressDown(field, { button: 2 });
    field.focus();
    field.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true }));

    expect(targets(calls)).to.eql(['field']);
    expect(pressed).to.eql([]);
  });

  it('forgets a press outside that opens the context menu, which ends in no click', async () => {
    const { host, outside, outsideText } = await focusOutFixture();
    const calls = listen(host, [host]);
    pressDown(outsideText);
    outsideText.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true }));

    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
  });

  it('forgets a press outside that starts a drag, which ends in no click', async () => {
    const { host, outside, outsideText } = await focusOutFixture();
    const calls = listen(host, [host]);
    pressDown(outsideText);
    outsideText.dispatchEvent(new DragEvent('dragstart', { bubbles: true, composed: true }));

    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
  });

  it('forgets a press outside once its click has been handled', async () => {
    const { host, outside } = await focusOutFixture();
    const calls = listen(host, [host]);
    pressDown(outside);
    click(outside);
    // The hook forgets the press once the click's own handlers have run.
    await aTimeout(0);

    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
  });

  it('forgets a press outside once a key is pressed', async () => {
    const { host, outside } = await focusOutFixture();
    const calls = listen(host, [host]);
    pressDown(outside);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    outside.focus();

    expect(targets(calls)).to.eql(['outside']);
  });

  it('skips focus moving into a shadow root inside a boundary', async () => {
    const { host, inside } = await focusOutFixture();
    const input = appendShadowInput(host);
    const calls = listen(host, [host]);
    inside.focus();

    input.focus();

    expect(targets(calls)).to.eql([]);
  });

  it('calls back with the shadow host when focus moves into a shadow root outside', async () => {
    const { container, host, inside } = await focusOutFixture();
    const input = appendShadowInput(container);
    const calls = listen(host, [host]);
    inside.focus();

    input.focus();

    expect(targets(calls)).to.eql(['shadow-host']);
  });

  it('does not support a boundary inside a shadow root, which it takes for its shadow host', async () => {
    const { container, host } = await focusOutFixture();
    const input = appendShadowInput(container);
    const calls = listen(host, [input]);

    input.focus();

    expect(targets(calls)).to.eql(['shadow-host']);
  });

  it('stops listening once the element disconnects', async () => {
    const { host, outside } = await focusOutFixture();
    const calls = listen(host, [host]);

    host.remove();
    outside.focus();

    expect(targets(calls)).to.eql([]);
  });
});
