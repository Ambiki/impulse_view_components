import type AwcPopoverElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture, nextFrame, waitUntil } from '@open-wc/testing';
import { Idiomorph } from 'idiomorph';
// Registers `awc-popover`. Kept separate from the type import above, which the bundler elides.
import './index';

/**
 * Mirrors the structure of `app/components/impulse/popover_component.html.erb`. Only the parts the element reads are
 * reproduced here: the targets and the actions. The trigger is fixed at (100, 100) and sized 50×20, and the panel is
 * 80×40. `content` goes inside the panel.
 */
function popoverHtml({ attributes = '', content = '' } = {}) {
  return `
    <awc-popover ${attributes} data-action="keydown->awc-popover#handleKeydown">
      <style>
        .trigger { position: fixed; left: 100px; top: 100px; width: 50px; height: 20px; margin: 0; padding: 0; border: 0; }
        .panel { width: 80px; height: 40px; margin: 0; padding: 0; border: 0; }
      </style>
      <button type="button" class="trigger" data-target="awc-popover.button" data-action="click->awc-popover#toggle">
        Open
      </button>
      <div class="panel" role="dialog" popover="manual" tabindex="-1" data-target="awc-popover.panel">
        <div class="arrow" data-target="awc-popover.arrow"></div>
        ${content}
      </div>
    </awc-popover>
  `;
}

async function popoverFixture(options: Parameters<typeof popoverHtml>[0] = {}) {
  const el = await fixture<AwcPopoverElement>(popoverHtml(options));
  await whenInitialized(el);
  return el;
}

const EVENTS = ['show', 'shown', 'hide', 'hidden'] as const;

/**
 * Whether `element` has focus. Compared here rather than with `expect(document.activeElement).to.equal(element)`, whose
 * failure message serializes both elements, which hangs the browser when one of them is `<body>`.
 */
function isFocused(element: Element | null) {
  return element !== null && document.activeElement === element;
}

/** Whether `panel` is showing in the top layer. */
function isPopoverOpen(panel: HTMLElement) {
  return panel.matches(':popover-open');
}

/** Records, in order, the `awc-popover:*` open and close events `el` dispatches. */
function recordEvents(el: AwcPopoverElement) {
  const events: string[] = [];
  for (const name of EVENTS) {
    el.addEventListener(`awc-popover:${name}`, (event) => {
      if (event.target === el) events.push(name);
    });
  }
  return events;
}

/** Prevents the next `awc-popover:<name>` event `el` dispatches, leaving alone those bubbling from popovers nested in it. */
function preventNext(el: AwcPopoverElement, name: 'show' | 'hide') {
  const type = `awc-popover:${name}` as const;
  el.addEventListener(type, function prevent(event) {
    if (event.target !== el) return;
    event.preventDefault();
    el.removeEventListener(type, prevent);
  });
}

/** Presses and releases `element` the way a mouse does, so that outside click handling sees the click too. */
function press(element: HTMLElement) {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  element.click();
}

/** Clicks outside every popover. */
function clickOutside() {
  press(document.body);
}

/** Waits long enough for a rejection from a `hide` that nothing awaits to be reported as `unhandledrejection`. */
async function settle() {
  await nextFrame();
  await nextFrame();
}

describe('awc-popover', () => {
  it('moves the open panel when `placement` changes', async () => {
    const el = await popoverFixture();
    el.show();
    await waitUntil(() => el.panel.getAttribute('x-placement') === 'bottom', 'did not position the panel');

    el.placement = 'top';

    await waitUntil(() => el.panel.getAttribute('x-placement') === 'top', 'did not move the panel');
    // Above the trigger, 8px away: 100 - 8 - 40.
    expect(el.panel.style.top).to.equal('52px');
  });

  it('closes cleanly when removed while open', async () => {
    const el = await popoverFixture();
    el.show();
    await waitUntil(() => el.panel.getAttribute('x-placement') === 'bottom', 'did not position the panel');
    const { button, panel } = el;
    const rejections: unknown[] = [];
    const onRejection = (event: PromiseRejectionEvent) => {
      rejections.push(event.reason);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', onRejection);

    try {
      el.remove();
      await settle();
    } finally {
      window.removeEventListener('unhandledrejection', onRejection);
    }

    expect(rejections).to.eql([]);
    expect(isPopoverOpen(panel)).to.equal(false);
    expect(button.getAttribute('aria-expanded')).to.equal('false');
  });

  describe('events', () => {
    it('stays closed when `show` is prevented', async () => {
      const el = await popoverFixture();
      const events = recordEvents(el);
      preventNext(el, 'show');

      el.button.click();
      await settle();

      expect(el.open).to.equal(false);
      expect(isPopoverOpen(el.panel)).to.equal(false);
      expect(events).to.eql(['show']);
    });

    it('emits the request and state events when its trigger is clicked', async () => {
      const el = await popoverFixture();
      const events = recordEvents(el);

      el.button.click();
      el.button.click();
      await settle();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['show', 'shown', 'hide', 'hidden']);
    });

    it('stays open when `hide` is prevented', async () => {
      const el = await popoverFixture();
      el.show();
      const events = recordEvents(el);
      preventNext(el, 'hide');

      el.button.click();
      await settle();

      expect(el.open).to.equal(true);
      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(events).to.eql(['hide']);
    });

    it('requests to hide on an outside click', async () => {
      const el = await popoverFixture();
      el.show();
      const events = recordEvents(el);
      preventNext(el, 'hide');

      clickOutside();
      await settle();
      expect(el.open).to.equal(true);

      clickOutside();
      await settle();
      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hide', 'hidden']);
    });

    it('requests to hide on Escape', async () => {
      const el = await popoverFixture();
      el.show();
      const events = recordEvents(el);
      const escape = () => el.panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      preventNext(el, 'hide');

      escape();
      await settle();
      expect(el.open).to.equal(true);

      escape();
      await settle();
      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hide', 'hidden']);
    });

    it('emits only the state events when shown and hidden from code', async () => {
      const el = await popoverFixture();
      const events = recordEvents(el);
      preventNext(el, 'show');
      preventNext(el, 'hide');

      el.show();
      await el.hide();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['shown', 'hidden']);
    });

    it('opens and closes when `open` changes, emitting only the state events', async () => {
      const el = await popoverFixture();
      const events = recordEvents(el);
      preventNext(el, 'show');
      preventNext(el, 'hide');

      el.open = true;
      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(el.button.getAttribute('aria-expanded')).to.equal('true');

      el.removeAttribute('open');
      await settle();

      expect(isPopoverOpen(el.panel)).to.equal(false);
      expect(el.button.getAttribute('aria-expanded')).to.equal('false');
      expect(events).to.eql(['shown', 'hidden']);
    });

    it('hides the popovers nested in it first, each emitting only `hidden`', async () => {
      const outer = await popoverFixture({ content: popoverHtml({ content: '<button type="button">Inside</button>' }) });
      const inner = outer.querySelector<AwcPopoverElement>('awc-popover')!;
      await whenInitialized(inner);
      outer.show();
      inner.show();
      const outerEvents = recordEvents(outer);
      const innerEvents = recordEvents(inner);

      await outer.hide();
      await settle();

      expect(isPopoverOpen(inner.panel)).to.equal(false);
      expect(innerEvents).to.eql(['hidden']);
      expect(outerEvents).to.eql(['hidden']);
      expect(isFocused(outer.button)).to.equal(true);
    });

    it('hides another popover and the ones nested in it, each emitting only `hidden`', async () => {
      const outer = await popoverFixture({ content: popoverHtml({ content: '<button type="button">Inside</button>' }) });
      const inner = outer.querySelector<AwcPopoverElement>('awc-popover')!;
      const el = await popoverFixture();
      await whenInitialized(inner);
      outer.show();
      inner.show();
      const outerEvents = recordEvents(outer);
      const innerEvents = recordEvents(inner);

      el.show();
      await settle();

      expect(innerEvents).to.eql(['hidden']);
      expect(outerEvents).to.eql(['hidden']);
      expect(el.open).to.equal(true);
    });

    it('hides the other open popovers when `open` is set', async () => {
      const other = await popoverFixture();
      const el = await popoverFixture();
      other.show();
      const otherEvents = recordEvents(other);

      el.setAttribute('open', '');
      await settle();

      expect(other.open).to.equal(false);
      expect(isPopoverOpen(other.panel)).to.equal(false);
      expect(otherEvents).to.eql(['hidden']);
    });

    it('emits the request events from `requestShow` and `requestHide`', async () => {
      const el = await popoverFixture();
      const events = recordEvents(el);

      el.requestShow();
      await el.requestHide();

      expect(events).to.eql(['show', 'shown', 'hide', 'hidden']);
    });

    it('does not open when another open popover refuses to hide', async () => {
      const other = await popoverFixture();
      const el = await popoverFixture();
      other.show();
      const otherEvents = recordEvents(other);
      const events = recordEvents(el);
      preventNext(other, 'hide');

      el.button.click();
      await settle();

      expect(other.open).to.equal(true);
      expect(el.open).to.equal(false);
      expect(otherEvents).to.eql(['hide']);
      expect(events).to.eql(['show']);
    });

    it('hides the other open popovers when it opens', async () => {
      const other = await popoverFixture();
      const el = await popoverFixture();
      other.show();
      const otherEvents = recordEvents(other);

      el.button.click();
      await settle();

      expect(other.open).to.equal(false);
      expect(el.open).to.equal(true);
      expect(otherEvents).to.eql(['hide', 'hidden']);
    });

    it('asks another open popover to hide once when its trigger is pressed', async () => {
      const other = await popoverFixture();
      const el = await popoverFixture();
      other.show();
      const otherEvents = recordEvents(other);

      press(el.button);
      await settle();

      expect(other.open).to.equal(false);
      expect(el.open).to.equal(true);
      expect(otherEvents).to.eql(['hide', 'hidden']);
    });

    it('leaves another open popover alone when its trigger is pressed and `show` is prevented', async () => {
      const other = await popoverFixture();
      const el = await popoverFixture();
      other.show();
      const otherEvents = recordEvents(other);
      preventNext(el, 'show');

      press(el.button);
      await settle();

      expect(other.open).to.equal(true);
      expect(el.open).to.equal(false);
      expect(otherEvents).to.eql([]);
    });

    it('does not emit a stale `hidden` when shown again while hiding', async () => {
      const el = await popoverFixture();
      el.show();
      const events = recordEvents(el);

      el.hide();
      el.show();
      await settle();

      expect(el.open).to.equal(true);
      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(events).to.eql(['shown']);
    });

    it('opens silently when it connects with `open` set', async () => {
      const events: string[] = [];
      for (const name of EVENTS) {
        document.addEventListener(`awc-popover:${name}`, () => events.push(name), { once: true });
      }

      const el = await popoverFixture({ attributes: 'open', content: '<button type="button" autofocus>Inside</button>' });

      expect(isPopoverOpen(el.panel)).to.equal(true);
      // Starting out open isn't a change, so it doesn't take focus either.
      expect(el.panel.contains(document.activeElement)).to.equal(false);
      expect(events).to.eql([]);
    });

    it('closes silently when removed, keeping `open`', async () => {
      const el = await popoverFixture();
      el.show();
      const { panel } = el;
      const events = recordEvents(el);

      el.remove();
      await settle();

      expect(el.open).to.equal(true);
      expect(isPopoverOpen(panel)).to.equal(false);
      expect(events).to.eql([]);
    });

    it('opens again silently when reconnected', async () => {
      const el = await popoverFixture();
      const parent = el.parentElement!;
      el.show();
      el.remove();
      await settle();
      const events = recordEvents(el);

      parent.append(el);
      await whenInitialized(el);

      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(el.button.getAttribute('aria-expanded')).to.equal('true');
      expect(events).to.eql([]);
    });

    it('stays closed when hidden while removed', async () => {
      const el = await popoverFixture();
      const parent = el.parentElement!;
      el.show();
      el.remove();
      await settle();
      const events = recordEvents(el);

      await el.hide();
      parent.append(el);
      await whenInitialized(el);

      expect(el.open).to.equal(false);
      expect(isPopoverOpen(el.panel)).to.equal(false);
      expect(events).to.eql([]);
    });

    it('emits nothing when asked to hide while removed', async () => {
      const el = await popoverFixture();
      el.show();
      el.remove();
      await settle();
      const events = recordEvents(el);

      await el.requestHide();
      await el.toggle();

      expect(events).to.eql([]);
    });

    it('opens silently once it connects when shown before', async () => {
      const container = await fixture<HTMLElement>('<div></div>');
      container.innerHTML = popoverHtml();
      const el = container.querySelector('awc-popover')!;
      const events = recordEvents(el);

      el.show();
      await whenInitialized(el);

      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(events).to.eql([]);
    });

    it('does nothing when `open` is set to the value it already has', async () => {
      const el = await popoverFixture();
      el.show();
      const events = recordEvents(el);

      el.open = true;
      el.setAttribute('open', 'open');

      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(events).to.eql([]);
    });
  });

  describe('focus', () => {
    it('moves focus to the first focusable element when it opens', async () => {
      const el = await popoverFixture({
        content: '<p>Text</p><button type="button" class="first">First</button><button type="button">Second</button>',
      });

      el.show();

      expect(isFocused(el.querySelector('.first'))).to.equal(true);
    });

    it('moves focus to the element with `autofocus` when it opens', async () => {
      const el = await popoverFixture({
        content: '<button type="button">First</button><button type="button" class="close" autofocus>Close</button>',
      });

      el.show();

      expect(isFocused(el.querySelector('.close'))).to.equal(true);
    });

    it('returns focus to the trigger when it closes with focus inside', async () => {
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });
      el.show();

      await el.hide();

      expect(isFocused(el.button)).to.equal(true);
    });

    it('returns focus to the trigger when it closes with focus lost', async () => {
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });
      el.show();
      // A press on something that can't take focus, such as plain text, moves focus to `<body>`.
      (document.activeElement as HTMLElement).blur();

      await el.hide();

      expect(isFocused(el.button)).to.equal(true);
    });

    it('leaves focus where it is when it closes with focus elsewhere', async () => {
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });
      const input = document.createElement('input');
      el.after(input);
      el.show();
      input.focus();

      await el.hide();

      expect(isFocused(input)).to.equal(true);
    });

    it('requests to hide when focus moves out of it', async () => {
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });
      const outside = document.createElement('button');
      el.after(outside);
      el.show();
      const events = recordEvents(el);
      preventNext(el, 'hide');

      outside.focus();
      await settle();
      expect(el.open).to.equal(true);

      el.querySelector<HTMLButtonElement>('.panel button')!.focus();
      outside.focus();
      await settle();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hide', 'hidden']);
    });

    it('stays open when focus moves within it or to its trigger', async () => {
      const el = await popoverFixture({ content: '<button type="button" class="a">A</button><button type="button" class="b">B</button>' });
      el.show();
      const events = recordEvents(el);

      el.querySelector<HTMLButtonElement>('.b')!.focus();
      el.button.focus();
      await settle();

      expect(el.open).to.equal(true);
      expect(events).to.eql([]);
    });

    it('requests to hide once when a press outside moves focus', async () => {
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });
      const outside = document.createElement('input');
      el.after(outside);
      el.show();
      const events = recordEvents(el);
      preventNext(el, 'hide');

      // A press focuses what it lands on between `pointerdown` and `click`.
      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      outside.focus();
      outside.click();
      await settle();

      expect(el.open).to.equal(true);
      expect(events).to.eql(['hide']);
    });

    it('keeps focus where it is, and stays open, when it connects open', async () => {
      const container = await fixture<HTMLElement>('<div><input></div>');
      const input = container.querySelector('input')!;
      input.focus();

      container.insertAdjacentHTML('beforeend', popoverHtml({ attributes: 'open', content: '<button type="button" autofocus>Inside</button>' }));
      const el = container.querySelector('awc-popover')!;
      const events = recordEvents(el);
      await whenInitialized(el);
      await settle();

      expect(el.open).to.equal(true);
      expect(isPopoverOpen(el.panel)).to.equal(true);
      expect(isFocused(input)).to.equal(true);
      expect(events).to.eql([]);
    });

    it('requests to hide when a press inside it moves focus out', async () => {
      const el = await popoverFixture({ content: '<button type="button" class="inside">Inside</button>' });
      const outside = document.createElement('button');
      el.after(outside);
      el.show();
      const events = recordEvents(el);

      // Such as a button inside that opens a dialog elsewhere on the page.
      el.querySelector('.inside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      outside.focus();
      await settle();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hidden']);
    });

    it('requests to hide when focus moves out after a press that ended without a click', async () => {
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });
      const pressed = document.createElement('div');
      const outside = document.createElement('button');
      el.after(pressed, outside);
      el.show();
      const events = recordEvents(el);

      // Such as a right-click, or a touch that turned into a scroll.
      pressed.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      outside.focus();
      await settle();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hidden']);
    });

    it('moves focus to the panel when it has nothing focusable', async () => {
      const el = await popoverFixture({ content: '<p>Text</p>' });

      el.show();

      expect(isFocused(el.panel)).to.equal(true);
    });
  });

  describe('nested popovers', () => {
    /**
     * A popover with a popover nested in it, both open. The parent panel holds a close button, as the header renders one,
     * and the nested panel holds a button.
     */
    async function nestedFixture() {
      const parent = await popoverFixture({
        content: `
          <button type="button" class="parent-close" data-action="click->awc-popover#requestHide">Close</button>
          ${popoverHtml({ content: '<button type="button" class="nested-button">Nested</button>' })}
        `,
      });
      const nested = parent.querySelector<AwcPopoverElement>('awc-popover')!;
      await whenInitialized(nested);
      parent.show();
      nested.show();
      return { parent, nested };
    }

    /** Records, in order, the open and close events of each popover in `popovers`, named after its key. */
    function recordEventsOf(popovers: Record<string, AwcPopoverElement>) {
      const events: string[] = [];
      for (const [key, el] of Object.entries(popovers)) {
        for (const name of EVENTS) {
          el.addEventListener(`awc-popover:${name}`, (event) => {
            if (event.target === el) events.push(`${key}:${name}`);
          });
        }
      }
      return events;
    }

    it('requests to hide with the popovers nested in it on one outside click, innermost first', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });

      clickOutside();
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(false);
      expect(events).to.eql(['nested:hide', 'nested:hidden', 'parent:hide', 'parent:hidden']);
    });

    it('stays open, and asks nothing more, when a popover nested in it refuses to hide on an outside click', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });
      preventNext(nested, 'hide');

      clickOutside();
      await settle();

      expect(nested.open).to.equal(true);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide']);
    });

    it('hides the popovers nested in it when it refuses to hide itself', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });
      preventNext(parent, 'hide');

      clickOutside();
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide', 'nested:hidden', 'parent:hide']);
    });

    it('asks a popover nested in it once when focus moves out of both', async () => {
      const { parent, nested } = await nestedFixture();
      const outside = document.createElement('button');
      parent.after(outside);
      const events = recordEventsOf({ parent, nested });
      preventNext(nested, 'hide');

      outside.focus();
      await settle();
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide']);

      nested.querySelector<HTMLButtonElement>('.nested-button')!.focus();
      outside.focus();
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(false);
      expect(events).to.eql(['nested:hide', 'nested:hide', 'nested:hidden', 'parent:hide', 'parent:hidden']);
    });

    it('asks a popover nested in it once when its close button is pressed', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });
      preventNext(nested, 'hide');

      press(parent.querySelector<HTMLButtonElement>('.parent-close')!);
      await settle();

      expect(nested.open).to.equal(true);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide']);
    });

    it('asks a popover nested in it once when its trigger is pressed', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });
      preventNext(nested, 'hide');

      press(parent.button);
      await settle();

      expect(nested.open).to.equal(true);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide']);
    });

    it('stays open on Escape and `requestHide` when a popover nested in it refuses to hide', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });
      // Such as a popover guarding unsaved input.
      nested.addEventListener('awc-popover:hide', (event) => event.preventDefault());

      parent.panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await parent.requestHide();
      await settle();

      expect(nested.open).to.equal(true);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide', 'nested:hide']);
    });

    it('hides only the innermost popover on Escape inside it', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });

      nested.panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide', 'nested:hidden']);
    });

    it('stays open when a click inside it hides a popover nested in it', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });

      press(parent.panel);
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['nested:hide', 'nested:hidden']);
    });

    it('stays open when a click inside a shadow root in it hides a popover nested in it', async () => {
      if (!customElements.get('test-shadow-content')) {
        customElements.define(
          'test-shadow-content',
          class extends HTMLElement {
            constructor() {
              super();
              this.attachShadow({ mode: 'open' }).innerHTML = '<span>Shadow</span>';
            }
          },
        );
      }
      const { parent, nested } = await nestedFixture();
      parent.panel.append(document.createElement('test-shadow-content'));
      const span = parent.querySelector('test-shadow-content')!.shadowRoot!.querySelector('span')!;

      span.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
      span.click();
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(true);
    });

    it('waits for the popovers nested in it to close before asking itself when its close button is pressed', async () => {
      const { parent, nested } = await nestedFixture();
      const events = recordEventsOf({ parent, nested });

      press(parent.querySelector<HTMLButtonElement>('.parent-close')!);
      await settle();

      expect(nested.open).to.equal(false);
      expect(parent.open).to.equal(false);
      expect(events).to.eql(['nested:hide', 'nested:hidden', 'parent:hide', 'parent:hidden']);
    });

    it('asks each popover once when its trigger is pressed with two levels nested in it', async () => {
      const parent = await popoverFixture({ content: popoverHtml({ content: popoverHtml() }) });
      const [nested, deepest] = Array.from(parent.querySelectorAll<AwcPopoverElement>('awc-popover'));
      await whenInitialized(deepest);
      parent.show();
      nested.show();
      deepest.show();
      const events = recordEventsOf({ parent, nested, deepest });
      nested.addEventListener('awc-popover:hide', (event) => {
        if (event.target === nested) event.preventDefault();
      });

      press(parent.button);
      await settle();

      expect(deepest.open).to.equal(false);
      expect(nested.open).to.equal(true);
      expect(parent.open).to.equal(true);
      expect(events).to.eql(['deepest:hide', 'deepest:hidden', 'nested:hide']);
    });
  });

  describe('stress', () => {
    // The popover API was used once before and dropped after random Chromium crashes on toggle (#174). These open and
    // close popovers as fast as each path allows, so that a crash fails the run.
    const ROUNDS = 100;

    it('survives rapid toggling through its trigger, `show` and `hide`, and `open`', async function () {
      this.timeout(20000);
      const el = await popoverFixture({ content: '<button type="button">Inside</button>' });

      for (let i = 0; i < ROUNDS; i++) {
        el.button.click();
        el.button.click();
        el.show();
        el.hide();
        el.open = true;
        el.open = false;
      }
      await settle();

      expect(el.open).to.equal(false);
      expect(isPopoverOpen(el.panel)).to.equal(false);
      expect(el.button.getAttribute('aria-expanded')).to.equal('false');
    });

    it('survives nested popovers and removal while open', async function () {
      this.timeout(20000);
      const container = await fixture<HTMLElement>('<div></div>');

      for (let i = 0; i < ROUNDS; i++) {
        container.innerHTML = popoverHtml({ content: popoverHtml({ content: '<button type="button">Inside</button>' }) });
        const [outer, inner] = Array.from(container.querySelectorAll('awc-popover'));
        await whenInitialized(outer);
        await whenInitialized(inner);
        outer.show();
        inner.show();
        if (i % 2 === 0) {
          outer.remove();
        } else {
          await outer.hide();
        }
      }
      await settle();

      expect(document.querySelectorAll(':popover-open').length).to.equal(0);
    });

    it('survives toggling inside a modal dialog', async function () {
      this.timeout(20000);
      const dialog = await fixture<HTMLDialogElement>(`<dialog>${popoverHtml({ content: '<button type="button">Inside</button>' })}</dialog>`);
      const el = dialog.querySelector('awc-popover')!;
      await whenInitialized(el);
      dialog.showModal();

      for (let i = 0; i < ROUNDS; i++) {
        el.button.click();
        el.button.click();
      }
      await settle();
      dialog.close();

      expect(el.open).to.equal(false);
      expect(isPopoverOpen(el.panel)).to.equal(false);
    });
  });

  it('stays open, and keeps working, after an open popover is moved', async () => {
    const el = await popoverFixture();
    const destination = document.createElement('section');
    el.parentElement!.append(destination);
    el.show();

    destination.append(el);
    await whenInitialized(el);
    expect(isPopoverOpen(el.panel)).to.equal(true);

    el.button.click();
    await settle();

    expect(el.open).to.equal(false);
    expect(isPopoverOpen(el.panel)).to.equal(false);
  });

  it('keeps its defaults through a morph to markup without them', async () => {
    const el = await popoverFixture();

    Idiomorph.morph(el, popoverHtml());

    expect(el.placement).to.equal('bottom');
    expect(el.strategy).to.equal('fixed');
  });

  it('falls back to its defaults when a morph removes their attributes', async () => {
    const el = await popoverFixture({ attributes: 'placement="top" strategy="absolute"' });
    expect(el.placement).to.equal('top');
    expect(el.strategy).to.equal('absolute');

    Idiomorph.morph(el, popoverHtml());

    expect(el.placement).to.equal('bottom');
    expect(el.strategy).to.equal('fixed');
  });
});
