import { whenInitialized } from '@ambiki/impulse';
import { expect, fixture } from '@open-wc/testing';
import { Idiomorph } from 'idiomorph';
// Registers `awc-clipboard-copy`.
import './index';

/** The markup `Impulse::ClipboardCopyComponent` renders, with `attributes`. */
function clipboardCopyHtml(attributes = 'value="Hello"') {
  return `<awc-clipboard-copy tabindex="0" ${attributes}>Copy</awc-clipboard-copy>`;
}

/** A clipboard copy with `attributes`, after `copySourceHtml`, which holds the copy sources it may name. */
async function clipboardCopyFixture(attributes?: string, copySourceHtml = '') {
  const container = await fixture<HTMLElement>(`<div>${copySourceHtml}${clipboardCopyHtml(attributes)}</div>`);
  const el = container.querySelector('awc-clipboard-copy')!;
  await whenInitialized(el);
  return el;
}

/**
 * Replaces the Clipboard API's `writeText`, the boundary the element writes through, so tests don't depend on the
 * browser granting clipboard access. Rejects with `error` when one is given.
 */
function stubClipboard(error?: Error) {
  const written: string[] = [];
  navigator.clipboard.writeText = async (text: string) => {
    if (error) throw error;
    written.push(text);
  };
  return written;
}

let recording: AbortController | undefined;

/** Records the `copied` and `error` events, with their detail, in the order they reach the document. */
function recordEvents() {
  recording = new AbortController();
  const events: Array<{ type: string; detail: unknown }> = [];
  const record = (event: Event) => events.push({ type: event.type, detail: (event as CustomEvent).detail });
  for (const type of ['awc-clipboard-copy:copied', 'awc-clipboard-copy:error']) {
    document.addEventListener(type, record, { signal: recording.signal });
  }
  return events;
}

/** Dispatches a `type` event for `key` from `target`, as pressing or releasing it there would. */
function dispatchKey(target: Element, type: 'keydown' | 'keyup', key: string) {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** Resolves once the element has finished the copy a press started: the clipboard write is asynchronous. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('awc-clipboard-copy', () => {
  afterEach(() => {
    recording?.abort();
    // Removing the own properties brings back the prototypes' `clipboard` and `writeText`.
    delete (navigator as { clipboard?: Clipboard }).clipboard;
    delete (navigator.clipboard as Partial<Clipboard>).writeText;
  });

  it('copies its value when clicked', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');

    el.click();
    await settle();

    expect(written).to.eql(['Hello']);
  });

  it('emits copied with the copied text once the clipboard has it', async () => {
    stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');
    const events = recordEvents();

    el.click();
    expect(events).to.eql([]);
    await settle();

    expect(events).to.eql([{ type: 'awc-clipboard-copy:copied', detail: { text: 'Hello' } }]);
  });

  it('emits error with the reason when the browser refuses the write', async () => {
    const refusal = new DOMException('Write permission denied.', 'NotAllowedError');
    stubClipboard(refusal);
    const el = await clipboardCopyFixture('value="Hello"');
    const events = recordEvents();

    el.click();
    await settle();

    expect(events).to.eql([{ type: 'awc-clipboard-copy:error', detail: { error: refusal } }]);
  });

  it('emits error when the page has no Clipboard API, as outside a secure context', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const el = await clipboardCopyFixture('value="Hello"');
    const events = recordEvents();

    el.click();
    await settle();

    expect(events.map(({ type }) => type)).to.eql(['awc-clipboard-copy:error']);
    expect((events[0].detail as { error: DOMException }).error.name).to.equal('NotSupportedError');
  });

  describe('with a copy source', () => {
    for (const [name, copySourceHtml] of [
      ['input', '<input id="source" value="From input">'],
      ['textarea', '<textarea id="source">From textarea</textarea>'],
      ['select', '<select id="source"><option>Other</option><option selected>From select</option></select>'],
    ]) {
      it(`copies the value of the ${name} it names`, async () => {
        const written = stubClipboard();
        const el = await clipboardCopyFixture('for="source"', copySourceHtml);

        el.click();
        await settle();

        expect(written).to.eql([`From ${name}`]);
      });
    }

    it('copies the rendered text of any other element it names', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture(
        'for="source"',
        '<div id="source"><div>First line</div><div>Second <span hidden>hidden </span>line</div></div>',
      );

      el.click();
      await settle();

      expect(written).to.eql(['First line\nSecond line']);
    });

    it('copies what the copy source holds when pressed, not when rendered', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('for="source"', '<input id="source" value="Before">');

      el.ownerDocument.querySelector<HTMLInputElement>('#source')!.value = 'After';
      el.click();
      await settle();

      expect(written).to.eql(['After']);
    });

    it('copies its own value instead, even an empty one', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="" for="source"', '<input id="source" value="From input">');

      el.click();
      await settle();

      expect(written).to.eql(['']);
    });

    it('emits error without writing when no element has the id it names', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('for="missing"');
      const events = recordEvents();

      el.click();
      await settle();

      expect(written).to.eql([]);
      expect(events.map(({ type }) => type)).to.eql(['awc-clipboard-copy:error']);
      expect((events[0].detail as { error: DOMException }).error.name).to.equal('NotFoundError');
    });
  });

  it('emits error without writing when it has neither a value nor a copy source', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('');
    const events = recordEvents();

    el.click();
    await settle();

    expect(written).to.eql([]);
    expect(events.map(({ type }) => type)).to.eql(['awc-clipboard-copy:error']);
    expect((events[0].detail as { error: DOMException }).error.name).to.equal('NotFoundError');
  });

  describe('from the keyboard', () => {
    it('copies when Enter is pressed', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');

      dispatchKey(el, 'keydown', 'Enter');
      await settle();

      expect(written).to.eql(['Hello']);
    });

    it('copies when Space is released, not when it is pressed, and keeps the page from scrolling', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');

      const press = dispatchKey(el, 'keydown', ' ');
      await settle();
      expect(press.defaultPrevented).to.equal(true);
      expect(written).to.eql([]);

      dispatchKey(el, 'keyup', ' ');
      await settle();
      expect(written).to.eql(['Hello']);
    });

    it('does not copy when focus leaves before Space is released', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      el.focus();

      dispatchKey(el, 'keydown', ' ');
      el.blur();
      el.focus();
      dispatchKey(el, 'keyup', ' ');
      await settle();

      expect(written).to.eql([]);
    });

    it('ignores keys pressed on its content', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      el.innerHTML = '<span>Copy</span>';
      const content = el.querySelector('span')!;

      dispatchKey(content, 'keydown', 'Enter');
      dispatchKey(content, 'keydown', ' ');
      dispatchKey(content, 'keyup', ' ');
      await settle();

      expect(written).to.eql([]);
    });
  });

  describe('when disabled', () => {
    it('ignores clicks and keys', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello" disabled');
      const events = recordEvents();

      el.click();
      dispatchKey(el, 'keydown', 'Enter');
      dispatchKey(el, 'keydown', ' ');
      dispatchKey(el, 'keyup', ' ');
      await settle();

      expect(written).to.eql([]);
      expect(events).to.eql([]);
    });

    it('stops taking focus when disabled after it renders, and takes it again once enabled', async () => {
      const el = await clipboardCopyFixture('value="Hello"');

      el.disabled = true;
      el.focus();
      expect(el.hasAttribute('disabled')).to.equal(true);
      expect(el.matches(':focus')).to.equal(false);

      el.disabled = false;
      el.focus();
      expect(el.tabIndex).to.equal(0);
      expect(el.matches(':focus')).to.equal(true);
    });

    it('catches up with a disabled changed while it was removed from the page', async () => {
      const el = await clipboardCopyFixture('value="Hello"');
      const parent = el.parentElement!;

      el.remove();
      el.disabled = true;
      parent.append(el);
      await whenInitialized(el);
      expect(el.hasAttribute('tabindex')).to.equal(false);

      el.remove();
      el.disabled = false;
      parent.append(el);
      await whenInitialized(el);
      expect(el.tabIndex).to.equal(0);
    });

    it('keeps clicks from the page, as a native disabled button gets none', async () => {
      const el = await clipboardCopyFixture('value="Hello" disabled');
      const clicks: Event[] = [];
      el.addEventListener('click', (event) => clicks.push(event));
      el.parentElement!.addEventListener('click', (event) => clicks.push(event));

      el.click();

      expect(clicks).to.eql([]);
    });

    it('copies again once enabled', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello" disabled');

      el.removeAttribute('disabled');
      el.click();
      await settle();

      expect(written).to.eql(['Hello']);
    });
  });

  it('follows a morph to the server HTML as it is disabled and enabled again', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');

    Idiomorph.morph(el, `<awc-clipboard-copy disabled value="Hello">Copy</awc-clipboard-copy>`);
    el.click();
    await settle();
    expect(el.disabled).to.equal(true);
    expect(el.hasAttribute('tabindex')).to.equal(false);
    expect(written).to.eql([]);

    Idiomorph.morph(el, clipboardCopyHtml('value="Changed"'));
    el.click();
    await settle();
    expect(el.tabIndex).to.equal(0);
    expect(written).to.eql(['Changed']);
  });
});
