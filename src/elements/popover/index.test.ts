import type AwcPopoverElement from './index';
import { expect, fixture, nextFrame, waitUntil } from '@open-wc/testing';
// Registers `awc-popover`. Kept separate from the type import above, which the bundler elides.
import './index';

/**
 * Mirrors the structure of `app/components/impulse/popover_component.html.erb`. Only the parts the element reads are
 * reproduced here: the targets and the actions. The trigger is fixed at (100, 100) and sized 50×20, and the panel is
 * 80×40.
 */
async function popoverFixture() {
  const el = await fixture<AwcPopoverElement>(`
    <awc-popover data-action="keydown->awc-popover#handleKeydown">
      <style>
        .trigger { position: fixed; left: 100px; top: 100px; width: 50px; height: 20px; margin: 0; padding: 0; border: 0; }
        .panel { width: 80px; height: 40px; margin: 0; padding: 0; border: 0; }
      </style>
      <button type="button" class="trigger" data-target="awc-popover.button" data-action="click->awc-popover#toggle">
        Open
      </button>
      <dialog class="panel" data-target="awc-popover.panel" data-action="close->awc-popover#handleClose">
        <div class="arrow" data-target="awc-popover.arrow"></div>
      </dialog>
    </awc-popover>
  `);
  // `connected` runs asynchronously, and sets this attribute once the targets and actions are wired up.
  await waitUntil(() => el.hasAttribute('data-impulse-element'));
  return el;
}

const EVENTS = ['show', 'shown', 'hide', 'hidden'] as const;

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

/** Prevents the next `awc-popover:<name>` event `el` dispatches. */
function preventNext(el: AwcPopoverElement, name: 'show' | 'hide') {
  el.addEventListener(`awc-popover:${name}`, (event) => event.preventDefault(), { once: true });
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
    expect(el.open).to.equal(false);
    expect(panel.open).to.equal(false);
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
      expect(el.panel.open).to.equal(false);
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
      expect(el.panel.open).to.equal(true);
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
      expect(el.panel.open).to.equal(true);
      expect(events).to.eql(['shown']);
    });

    it('opens silently when it connects with `open` set', async () => {
      const events: string[] = [];
      for (const name of EVENTS) {
        document.addEventListener(`awc-popover:${name}`, () => events.push(name), { once: true });
      }

      const el = await fixture<AwcPopoverElement>(`
        <awc-popover open>
          <button type="button" data-target="awc-popover.button">Open</button>
          <dialog data-target="awc-popover.panel"></dialog>
        </awc-popover>
      `);
      await waitUntil(() => el.hasAttribute('data-impulse-element'));

      expect(el.panel.open).to.equal(true);
      expect(events).to.eql([]);
    });

    it('closes silently when removed', async () => {
      const el = await popoverFixture();
      el.show();
      const events = recordEvents(el);

      el.remove();
      await settle();

      expect(el.open).to.equal(false);
      expect(events).to.eql([]);
    });
  });

  it('keeps working after an open popover is moved', async () => {
    const el = await popoverFixture();
    const destination = document.createElement('section');
    el.parentElement!.append(destination);
    el.show();

    destination.append(el);
    await waitUntil(() => el.button !== null, 'did not re-initialize after the move');
    el.button.click();

    expect(el.open).to.equal(true);
  });
});
