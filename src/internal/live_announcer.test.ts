import { fixture } from '@ambiki/impulse/testing';
import LiveAnnouncer from './live_announcer';

/** Moves on to when the announcer writes, which it does two frames after it is asked to. */
function written() {
  vi.advanceTimersToNextFrame();
  vi.advanceTimersToNextFrame();
}

function texts(liveRegion: HTMLElement) {
  return Array.from(liveRegion.children, (element) => element.textContent);
}

describe('LiveAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

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
    written();

    expect(texts(polite)).to.deep.equal(['Saved']);
  });

  it('writes what is announced together together, each in its own live region', async () => {
    const { announcer, polite, assertive } = await setup();

    announcer.announce(polite, {}, 'Goal created.');
    announcer.announce(assertive, {}, 'Couldn’t email the parents.');
    announcer.announce(polite, {}, 'Copied.');
    written();

    expect(texts(polite)).to.deep.equal(['Goal created.', 'Copied.']);
    expect(texts(assertive)).to.deep.equal(['Couldn’t email the parents.']);
  });

  it('writes a subject announced again before it was heard once, as it is now', async () => {
    const { announcer, polite, assertive } = await setup();
    const upload = {};

    announcer.announce(polite, upload, 'Uploading…');
    announcer.announce(polite, upload, 'Uploaded.');
    written();
    expect(texts(polite)).to.deep.equal(['Uploaded.']);

    const save = {};
    announcer.announce(polite, save, 'Saving…');
    announcer.announce(assertive, save, 'Couldn’t save.');
    written();
    expect(texts(polite)).to.deep.equal([]);
    expect(texts(assertive)).to.deep.equal(['Couldn’t save.']);
  });

  it('replaces what the live region last said, and empties it once that has been heard', async () => {
    const { announcer, polite } = await setup();
    announcer.announce(polite, {}, 'Saved');
    written();

    announcer.announce(polite, {}, 'Copied');
    expect(texts(polite)).to.deep.equal([]);
    written();
    expect(texts(polite)).to.deep.equal(['Copied']);

    vi.advanceTimersByTime(1100);
    expect(texts(polite)).to.deep.equal([]);
  });
});
