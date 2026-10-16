import { ImpulseElement, registerElement } from '@ambiki/impulse';
import type { Middleware, Placement } from '@floating-ui/dom';
import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
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
  // `connected` runs asynchronously; the hook relies on the element's lifecycle being started.
  await waitUntil(() => host.hasAttribute('data-impulse-element'));
  const anchor = host.querySelector<HTMLElement>('.anchor')!;
  const floating = host.querySelector<HTMLElement>('.floating')!;
  const arrow = host.querySelector<HTMLElement>('.arrow')!;
  return { host, anchor, floating, arrow };
}

/** Moves the anchor, then fires the `resize` event `autoUpdate` listens for. */
function moveAnchor(anchor: HTMLElement, position: { left?: string; top?: string; right?: string; bottom?: string }) {
  Object.assign(anchor.style, position);
  window.dispatchEvent(new Event('resize'));
}

/** Waits long enough for any pending `autoUpdate` reposition to have landed. */
async function settle() {
  await nextFrame();
  await nextFrame();
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

  it('positions the floating element at `bottom-start` with a fixed strategy by default', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating });

    host.open = true;
    await floatingUI.update();

    expect(floating.style.position).to.equal('fixed');
    expect(floating.style.left).to.equal('100px');
    expect(floating.style.top).to.equal('120px');
    expect(floating.getAttribute('x-placement')).to.equal('bottom-start');
  });

  it('honours `placement` and `offsetOptions`', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, {
      referenceElement: anchor,
      popupElement: floating,
      placement: 'top',
      offsetOptions: 8,
    });

    host.open = true;
    await floatingUI.update();

    // Centred over the anchor: 125 - 80 / 2 = 85. Above it: 100 - 8 - 40 = 52.
    expect(floating.style.left).to.equal('85px');
    expect(floating.style.top).to.equal('52px');
    expect(floating.getAttribute('x-placement')).to.equal('top');
  });

  it('flips to the opposite side when there is no room', async () => {
    const { host, anchor, floating } = await floatingFixture();
    moveAnchor(anchor, { top: `${window.innerHeight - 30}px` });
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating });

    host.open = true;
    await floatingUI.update();

    expect(floating.style.top).to.equal(`${window.innerHeight - 30 - 40}px`);
    expect(floating.getAttribute('x-placement')).to.equal('top-start');
  });

  it('flips the alignment when the floating element would overflow along the anchor', async () => {
    const { host, anchor, floating } = await floatingFixture();
    moveAnchor(anchor, { left: `${window.innerWidth - 60}px` });
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating });

    host.open = true;
    await floatingUI.update();

    // Aligned to the anchor's right edge instead: (innerWidth - 10) - 80.
    expect(floating.style.left).to.equal(`${window.innerWidth - 90}px`);
    expect(floating.getAttribute('x-placement')).to.equal('bottom-end');
  });

  it('shifts the floating element back inside the viewport when no alignment fits', async () => {
    const { host, anchor, floating } = await floatingFixture();
    moveAnchor(anchor, { left: `${window.innerWidth - 60}px` });
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating, placement: 'bottom' });

    host.open = true;
    await floatingUI.update();

    expect(floating.style.left).to.equal(`${window.innerWidth - 80}px`);
    expect(floating.getAttribute('x-placement')).to.equal('bottom');
  });

  it('syncs the width of the floating element to the anchor', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating, sync: 'width' });

    host.open = true;
    await floatingUI.update();

    expect(floating.style.width).to.equal('50px');
    expect(floating.style.height).to.equal('');
  });

  it('exposes the available height as a custom property', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, {
      referenceElement: anchor,
      popupElement: floating,
      autoSize: 'height',
      autoSizePadding: 10,
    });

    host.open = true;
    await floatingUI.update();

    // From the floating element's top edge (120px) to 10px short of the viewport's bottom edge.
    expect(floating.style.getPropertyValue('--awc-auto-size-height')).to.equal(`${window.innerHeight - 120 - 10}px`);
    expect(floating.style.getPropertyValue('--awc-auto-size-width')).to.equal('');
  });

  it('points the arrow at the anchor', async () => {
    const { host, anchor, floating, arrow } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating, arrowElement: arrow });

    host.open = true;
    await floatingUI.update();

    // The anchor's centre is at x = 125 and the floating element starts at x = 100, so the 8px arrow starts 125 - 100 - 4 = 21px in.
    expect(arrow.style.left).to.equal('21px');
    expect(arrow.style.top).to.equal('');
  });

  it('reads an options object once, when created', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const options: { referenceElement: HTMLElement; popupElement: HTMLElement; placement?: 'top' } = {
      referenceElement: anchor,
      popupElement: floating,
    };
    const floatingUI = useFloatingUI(host, options);

    options.placement = 'top';
    host.open = true;
    await floatingUI.update();

    expect(floating.getAttribute('x-placement')).to.equal('bottom-start');
  });

  it('positions the floating element once when created, even while closed', async () => {
    const { host, anchor, floating } = await floatingFixture();
    useFloatingUI(host, { referenceElement: anchor, popupElement: floating });
    await settle();

    expect(floating.style.position).to.equal('fixed');
    expect(floating.style.left).to.equal('100px');
  });

  it('does not reposition on `update` while closed', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating });
    await settle();

    moveAnchor(anchor, { left: '200px' });
    await floatingUI.update();

    expect(floating.style.left).to.equal('100px');
  });

  it('follows the anchor between `start` and `stop`', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating });

    host.open = true;
    floatingUI.start();
    moveAnchor(anchor, { left: '200px' });
    await waitUntil(() => floating.style.left === '200px', 'did not follow the anchor');

    await floatingUI.stop();
    moveAnchor(anchor, { left: '300px' });
    await settle();

    expect(floating.style.left).to.equal('200px');
  });

  it('stops following the anchor when the element disconnects', async () => {
    const { host, anchor, floating } = await floatingFixture();
    const floatingUI = useFloatingUI(host, { referenceElement: anchor, popupElement: floating });
    host.open = true;
    floatingUI.start();
    await waitUntil(() => floating.style.left === '100px');

    // Keep the anchor in the document so a lingering `autoUpdate` would still have something to follow.
    document.body.append(anchor);
    host.remove();
    moveAnchor(anchor, { left: '200px' });
    await settle();

    expect(floating.style.left).to.equal('100px');
    anchor.remove();
  });

  it('reads options from a function every time it repositions', async () => {
    const { host, anchor, floating } = await floatingFixture();
    let placement: Placement = 'bottom-start';
    const floatingUI = useFloatingUI(host, () => ({ referenceElement: anchor, popupElement: floating, placement }));

    host.open = true;
    await floatingUI.update();
    expect(floating.getAttribute('x-placement')).to.equal('bottom-start');

    placement = 'top';
    await floatingUI.update();

    expect(floating.style.top).to.equal('60px');
    expect(floating.getAttribute('x-placement')).to.equal('top');
  });
});
