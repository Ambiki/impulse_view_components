import { ImpulseElement, registerElement } from '@ambiki/impulse';
import type { Middleware } from '@floating-ui/dom';
import { expect, fixture, html } from '@open-wc/testing';
import useFloatingUI from './use_floating_ui';

/**
 * The smallest element the hook can be attached to: it only needs `open` and the impulse lifecycle.
 */
@registerElement('floating-ui-host')
class FloatingUIHost extends ImpulseElement {
  open = false;
}

/**
 * An anchor at (100, 100) sized 50×20, and an 80×40 floating element. The anchor is fixed so its geometry doesn't
 * depend on where the test runner renders the fixture. The floating element is sized by a stylesheet because the hook
 * owns its inline `width` and `height`.
 */
async function floatingFixture() {
  const host = await fixture<FloatingUIHost>(html`
    <floating-ui-host>
      <style>
        .anchor {
          position: fixed;
          left: 100px;
          top: 100px;
          width: 50px;
          height: 20px;
          margin: 0;
          padding: 0;
          border: 0;
        }
        .floating {
          width: 80px;
          height: 40px;
          margin: 0;
          padding: 0;
        }
        .arrow {
          position: absolute;
          width: 8px;
          height: 8px;
        }
      </style>
      <button class="anchor">Anchor</button>
      <div class="floating"><div class="arrow"></div></div>
    </floating-ui-host>
  `);
  const anchor = host.querySelector<HTMLElement>('.anchor')!;
  const floating = host.querySelector<HTMLElement>('.floating')!;
  const arrow = host.querySelector<HTMLElement>('.arrow')!;
  return { host, anchor, floating, arrow };
}

/** Moves the floating element 7px along the x axis. */
const nudge: Middleware = { name: 'nudge', fn: ({ x }) => ({ x: x + 7 }) };

describe('useFloatingUI', () => {
  it('runs custom middleware', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating, middleware: [nudge] });

    host.open = true;
    await floatingUI.update();

    expect(floating.style.left).to.equal('107px');
    expect(floating.style.top).to.equal('120px');
  });

  it('aligns the arrow after custom middleware has moved the floating element', async () => {
    const { host, anchor, floating, arrow } = await floatingFixture();
    const floatingUI = useFloatingUI(host, {
      referenceElement: anchor,
      popupElement: floating,
      arrowElement: arrow,
      middleware: [nudge],
    });

    host.open = true;
    await floatingUI.update();

    // The anchor's centre is at x = 125. The floating element starts at x = 107, so the 8px arrow starts 125 - 107 - 4 = 14px in.
    expect(arrow.style.left).to.equal('14px');
  });
});
