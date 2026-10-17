import type AwcAnchorElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture, nextFrame, waitUntil } from '@open-wc/testing';
// Registers `awc-anchor`. Kept separate from the type import above, which the bundler elides.
import './index';

/**
 * An anchor at (100, 100) sized 50×20, and an 80×40 `awc-anchor`. The anchor is fixed so its geometry doesn't depend
 * on where the test runner renders the fixture. The floating element is sized by a stylesheet because it owns its
 * inline `width` and `height`.
 */
async function anchorFixture(attributes = 'active') {
  const container = await fixture<HTMLElement>(`
    <div>
      <style>
        .anchor { position: fixed; left: 100px; top: 100px; width: 50px; height: 20px; margin: 0; padding: 0; border: 0; }
        awc-anchor { display: block; width: 80px; height: 40px; margin: 0; padding: 0; }
        [data-arrow] { position: absolute; width: 8px; height: 8px; }
      </style>
      <button id="anchor" class="anchor">Anchor</button>
      <awc-anchor anchor-id="anchor" ${attributes}><div data-arrow></div></awc-anchor>
    </div>
  `);
  const anchor = container.querySelector<HTMLElement>('#anchor')!;
  const floating = container.querySelector<AwcAnchorElement>('awc-anchor')!;
  const arrow = floating.querySelector<HTMLElement>('[data-arrow]')!;
  await whenInitialized(floating);
  return { container, anchor, floating, arrow };
}

/** Moves the anchor, then fires the `resize` event `autoUpdate` listens for. */
function moveAnchor(anchor: HTMLElement, position: { left?: string; top?: string }) {
  Object.assign(anchor.style, position);
  window.dispatchEvent(new Event('resize'));
}

/** Waits long enough for any pending `autoUpdate` reposition to have landed. */
async function settle() {
  await nextFrame();
  await nextFrame();
}

describe('awc-anchor', () => {
  it('positions itself below the anchor with a fixed strategy when active', async () => {
    const { floating } = await anchorFixture();
    await floating.reposition();

    // Centred under the anchor: 125 - 80 / 2 = 85.
    expect(floating.style.position).to.equal('fixed');
    expect(floating.style.left).to.equal('85px');
    expect(floating.style.top).to.equal('120px');
    expect(floating.getAttribute('x-placement')).to.equal('bottom');
  });

  it('stays at the origin while inactive', async () => {
    const { floating } = await anchorFixture('');
    await floating.reposition();

    expect(floating.style.position).to.equal('fixed');
    expect(floating.style.left).to.equal('0px');
    expect(floating.style.top).to.equal('0px');
  });

  it('follows the anchor while active, and stops once deactivated', async () => {
    const { anchor, floating } = await anchorFixture('');

    floating.active = true;
    await waitUntil(() => floating.style.left === '85px', 'did not position once activated');
    moveAnchor(anchor, { left: '200px' });
    await waitUntil(() => floating.style.left === '185px', 'did not follow the anchor');

    floating.active = false;
    await settle();
    moveAnchor(anchor, { left: '300px' });
    await settle();

    expect(floating.style.left).to.equal('185px');
  });

  it('activates and follows the anchor when started', async () => {
    const { anchor, floating } = await anchorFixture('');

    floating.start();

    expect(floating.active).to.equal(true);
    await waitUntil(() => floating.style.left === '85px', 'did not position once started');
    moveAnchor(anchor, { left: '200px' });
    await waitUntil(() => floating.style.left === '185px', 'did not follow the anchor');
  });

  it('deactivates and stops following the anchor when stopped', async () => {
    const { anchor, floating } = await anchorFixture();
    await floating.reposition();

    await floating.stop();
    moveAnchor(anchor, { left: '200px' });
    await settle();

    expect(floating.active).to.equal(false);
    expect(floating.style.left).to.equal('85px');
  });

  it('stays active when disconnected, so it resumes once reconnected', async () => {
    const { container, anchor, floating } = await anchorFixture();
    await floating.reposition();

    floating.remove();
    container.append(floating);
    moveAnchor(anchor, { left: '200px' });

    expect(floating.active).to.equal(true);
    await waitUntil(() => floating.style.left === '185px', 'did not resume following the anchor');
  });

  it('offsets itself by `distance` and `skidding`', async () => {
    const { floating } = await anchorFixture('active distance="8" skidding="5"');
    await floating.reposition();

    expect(floating.style.left).to.equal('90px');
    expect(floating.style.top).to.equal('128px');
  });

  it('flips to the opposite side when there is no room', async () => {
    const { anchor, floating } = await anchorFixture();
    moveAnchor(anchor, { top: `${window.innerHeight - 30}px` });
    await floating.reposition();

    expect(floating.style.top).to.equal(`${window.innerHeight - 30 - 40}px`);
    expect(floating.getAttribute('x-placement')).to.equal('top');
  });

  it('keeps its placement when `flip` is false', async () => {
    const { anchor, floating } = await anchorFixture('active flip="false"');
    moveAnchor(anchor, { top: `${window.innerHeight - 30}px` });
    await floating.reposition();

    expect(floating.style.top).to.equal(`${window.innerHeight - 10}px`);
    expect(floating.getAttribute('x-placement')).to.equal('bottom');
  });

  it('flips to `fallback-placements` when there is no room', async () => {
    const { anchor, floating } = await anchorFixture(`active fallback-placements='["right"]'`);
    moveAnchor(anchor, { top: `${window.innerHeight - 30}px` });
    await floating.reposition();

    expect(floating.style.left).to.equal('150px');
    expect(floating.getAttribute('x-placement')).to.equal('right');
  });

  it('shifts back inside the viewport by default', async () => {
    const { anchor, floating } = await anchorFixture();
    moveAnchor(anchor, { left: `${window.innerWidth - 60}px` });
    await floating.reposition();

    expect(floating.style.left).to.equal(`${window.innerWidth - 80}px`);
  });

  it('overflows the viewport when `shift` is false', async () => {
    const { anchor, floating } = await anchorFixture('active shift="false"');
    moveAnchor(anchor, { left: `${window.innerWidth - 60}px` });
    await floating.reposition();

    // Centred under the anchor: (innerWidth - 35) - 40, which pokes 5px past the viewport's right edge.
    expect(floating.style.left).to.equal(`${window.innerWidth - 75}px`);
  });

  it('syncs its width to the anchor', async () => {
    const { floating } = await anchorFixture('active sync="width"');
    await floating.reposition();

    expect(floating.style.width).to.equal('50px');
    expect(floating.style.height).to.equal('');
  });

  it('leaves the element\'s own auto size custom properties alone', async () => {
    const { floating } = await anchorFixture();
    floating.style.setProperty('--awc-auto-size-height', '100px');
    await floating.reposition();

    expect(floating.style.getPropertyValue('--awc-auto-size-height')).to.equal('100px');
  });

  it('exposes the available height as a custom property with `auto-size`', async () => {
    const { floating } = await anchorFixture('active auto-size="height" auto-size-padding="10"');
    await floating.reposition();

    // From its top edge (120px) to 10px short of the viewport's bottom edge.
    expect(floating.style.getPropertyValue('--awc-auto-size-height')).to.equal(`${window.innerHeight - 120 - 10}px`);
    expect(floating.style.getPropertyValue('--awc-auto-size-width')).to.equal('');
  });

  it('points its `[data-arrow]` at the anchor', async () => {
    const { floating, arrow } = await anchorFixture();
    await floating.reposition();

    // Centred: 80 / 2 - 8 / 2 = 36.
    expect(arrow.style.left).to.equal('36px');
    expect(arrow.style.top).to.equal('');
  });

  it('keeps no padding around its arrow by default, even with a border radius', async () => {
    const { anchor, floating, arrow } = await anchorFixture('active style="border-radius: 10px"');
    // A 10px wide anchor at the viewport's left edge: the arrow has to point 5px in.
    Object.assign(anchor.style, { left: '0px', width: '10px' });
    await floating.reposition();

    // Shifted against the left edge at x = 0, so the 8px arrow starts 5 - 4 = 1px in.
    expect(floating.style.left).to.equal('0px');
    expect(arrow.style.left).to.equal('1px');
  });

  it('keeps `arrow-padding` around its arrow', async () => {
    const { anchor, floating, arrow } = await anchorFixture('active arrow-padding="6"');
    Object.assign(anchor.style, { left: '0px', width: '10px' });
    await floating.reposition();

    expect(arrow.style.left).to.equal('6px');
  });

  it('follows a different anchor when `anchor-id` changes', async () => {
    const { container, floating } = await anchorFixture();
    const other = document.createElement('button');
    other.id = 'other-anchor';
    other.className = 'anchor';
    other.style.left = '300px';
    container.append(other);

    floating.anchorId = 'other-anchor';

    await waitUntil(() => floating.style.left === '285px', 'did not follow the new anchor');
  });

  it('stops following the anchor when disconnected', async () => {
    const { anchor, floating } = await anchorFixture();
    await floating.reposition();

    floating.remove();
    moveAnchor(anchor, { left: '200px' });
    await settle();

    expect(floating.style.left).to.equal('85px');
  });
});
