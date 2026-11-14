import { aTimeout, expect, fixture, nextFrame } from '@open-wc/testing';
import LiveAnnouncer from './live_announcer';

/** Waits for the announcer to write, which it does two frames after it is asked to. */
async function written() {
  await nextFrame();
  await nextFrame();
  await nextFrame();
}

function texts(liveRegion: HTMLElement) {
  return Array.from(liveRegion.children, (element) => element.textContent);
}

describe('LiveAnnouncer', () => {
  async function setup() {
    const container = await fixture<HTMLDivElement>(
      '<div><div id="polite" aria-live="polite"></div><div id="assertive" aria-live="assertive"></div></div>',
    );
    const polite = container.querySelector<HTMLElement>('#polite')!;
    const assertive = container.querySelector<HTMLElement>('#assertive')!;
    return { announcer: new LiveAnnouncer<object>(), polite, assertive };
  }

  it('writes the text into the live region a couple of frames later, so that it is heard as a change', async () => {
    const { announcer, polite } = await setup();

    announcer.announce(polite, {}, 'Saved');
    expect(texts(polite)).to.deep.equal([]);
    await written();

    expect(texts(polite)).to.deep.equal(['Saved']);
  });

  it('writes what is announced together together, each in its own live region', async () => {
    const { announcer, polite, assertive } = await setup();

    announcer.announce(polite, {}, 'Goal created.');
    announcer.announce(assertive, {}, 'Couldn’t email the parents.');
    announcer.announce(polite, {}, 'Copied.');
    await written();

    expect(texts(polite)).to.deep.equal(['Goal created.', 'Copied.']);
    expect(texts(assertive)).to.deep.equal(['Couldn’t email the parents.']);
  });

  it('writes a subject announced again before it was heard once, as it is now', async () => {
    const { announcer, polite, assertive } = await setup();
    const upload = {};

    announcer.announce(polite, upload, 'Uploading…');
    announcer.announce(polite, upload, 'Uploaded.');
    await written();
    expect(texts(polite)).to.deep.equal(['Uploaded.']);

    const save = {};
    announcer.announce(polite, save, 'Saving…');
    announcer.announce(assertive, save, 'Couldn’t save.');
    await written();
    expect(texts(polite)).to.deep.equal([]);
    expect(texts(assertive)).to.deep.equal(['Couldn’t save.']);
  });

  it('replaces what the live region last said, and empties it once that has been heard', async () => {
    const { announcer, polite } = await setup();
    announcer.announce(polite, {}, 'Saved');
    await written();

    announcer.announce(polite, {}, 'Copied');
    expect(texts(polite)).to.deep.equal([]);
    await written();
    expect(texts(polite)).to.deep.equal(['Copied']);

    await aTimeout(1100);
    expect(texts(polite)).to.deep.equal([]);
  });
});
