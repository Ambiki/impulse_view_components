import { expect, fixture, nextFrame, waitUntil } from '@open-wc/testing';
// Registers `awc-popover`. Kept separate from the type import below, which the bundler elides.
import './index';
import type AwcPopoverElement from './index';

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
      <dialog class="panel" data-target="awc-popover.panel" data-action="close->awc-popover#hide">
        <div class="arrow" data-target="awc-popover.arrow"></div>
      </dialog>
    </awc-popover>
  `);
  // `connected` runs asynchronously, and sets this attribute once the targets and actions are wired up.
  await waitUntil(() => el.hasAttribute('data-impulse-element'));
  return el;
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
});
