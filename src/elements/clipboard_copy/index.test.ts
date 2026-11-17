import { fixture, recordEvents, whenSettled } from '@ambiki/impulse/testing';
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
  return container.querySelector('awc-clipboard-copy')!;
}

/**
 * Replaces the Clipboard API's `writeText`, the boundary the element writes through, so tests don't depend on the
 * browser granting clipboard access. Rejects with `error` when one is given.
 *
 * A press starts the write in its own handler, so `written` holds it as soon as the press returns: a test that expects
 * no copy can check at once. Only the `copied` or `error` event that follows waits on the write.
 */
function stubClipboard(error?: Error) {
  const written: string[] = [];
  navigator.clipboard.writeText = async (text: string) => {
    if (error) throw error;
    written.push(text);
  };
  return written;
}

const EVENTS = ['awc-clipboard-copy:copied', 'awc-clipboard-copy:error'] as const;

/** Records the `copied` and `error` events, in the order they reach `target`, the document by default. */
function recordCopies(target: Node = document) {
  return recordEvents(target, EVENTS);
}

/** The type and detail of each recorded event. */
function summary(copies: ReturnType<typeof recordCopies>) {
  return copies.events.map(({ type, detail }) => ({ type, detail }));
}

/** Dispatches a `type` event for `key` from `target`, as pressing or releasing it there would. */
function dispatchKey(target: Element, type: 'keydown' | 'keyup', key: string) {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true, composed: true });
  target.dispatchEvent(event);
  return event;
}

/** The feedback state the element is in, if any. */
function feedback(el: Element) {
  if (el.matches(':state(copied)')) return 'copied';
  if (el.matches(':state(error)')) return 'error';
  return null;
}

describe('awc-clipboard-copy', () => {
  afterEach(() => {
    // Removing the own properties brings back the prototypes' `clipboard` and `writeText`.
    delete (navigator as { clipboard?: Clipboard }).clipboard;
    delete (navigator.clipboard as Partial<Clipboard>).writeText;
  });

  it('copies its value when clicked', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');
    const copies = recordCopies();

    el.click();
    await copies.waitFor('awc-clipboard-copy:copied');

    expect(written).to.eql(['Hello']);
  });

  it('copies the value property, which is its value attribute', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');
    expect(el.value).to.equal('Hello');
    const copies = recordCopies();

    el.value = 'Changed';
    el.click();
    await copies.waitFor('awc-clipboard-copy:copied');

    expect(el.getAttribute('value')).to.equal('Changed');
    expect(written).to.eql(['Changed']);
  });

  it('emits copied with the copied text once the clipboard has it', async () => {
    stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');
    const copies = recordCopies();

    el.click();
    expect(summary(copies)).to.eql([]);
    await copies.waitFor('awc-clipboard-copy:copied');

    expect(summary(copies)).to.eql([{ type: 'awc-clipboard-copy:copied', detail: { text: 'Hello' } }]);
  });

  it('emits error with the reason when the browser refuses the write', async () => {
    const refusal = new DOMException('Write permission denied.', 'NotAllowedError');
    stubClipboard(refusal);
    const el = await clipboardCopyFixture('value="Hello"');
    const copies = recordCopies();

    el.click();
    await copies.waitFor('awc-clipboard-copy:error');

    expect(summary(copies)).to.eql([{ type: 'awc-clipboard-copy:error', detail: { error: refusal } }]);
  });

  it('emits error when the page has no Clipboard API, as outside a secure context', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const el = await clipboardCopyFixture('value="Hello"');
    const copies = recordCopies();

    el.click();
    const error = await copies.waitFor('awc-clipboard-copy:error');

    expect(copies.types).to.eql(['awc-clipboard-copy:error']);
    expect((error.detail.error as DOMException).name).to.equal('NotSupportedError');
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
        const copies = recordCopies();

        el.click();
        await copies.waitFor('awc-clipboard-copy:copied');

        expect(written).to.eql([`From ${name}`]);
      });
    }

    it('copies the rendered text of any other element it names', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture(
        'for="source"',
        '<div id="source"><div>First line</div><div>Second <span hidden>hidden </span>line</div></div>',
      );
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['First line\nSecond line']);
    });

    it('copies what the copy source holds when pressed, not when rendered', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('for="source"', '<input id="source" value="Before">');

      const copies = recordCopies();

      el.ownerDocument.querySelector<HTMLInputElement>('#source')!.value = 'After';
      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['After']);
    });

    it('copies its own value instead, when it has one', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Own value" for="source"', '<input id="source" value="From input">');
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['Own value']);
    });

    it('copies the copy source when its value is empty', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="" for="source"', '<input id="source" value="From input">');
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['From input']);
    });

    it('takes its copy source from the for property', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('for="source"', '<input id="source" value="First"><input id="other" value="Second">');
      expect(el.for).to.equal('source');
      const copies = recordCopies();

      el.for = 'other';
      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(el.getAttribute('for')).to.equal('other');
      expect(written).to.eql(['Second']);
    });

    it('emits error without writing when no element has the id it names', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('for="missing"');
      const copies = recordCopies();

      el.click();
      const error = await copies.waitFor('awc-clipboard-copy:error');

      expect(written).to.eql([]);
      expect(copies.types).to.eql(['awc-clipboard-copy:error']);
      expect((error.detail.error as DOMException).name).to.equal('NotFoundError');
    });
  });

  it('emits error without writing when it has neither a value nor a copy source', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('');
    const copies = recordCopies();

    el.click();
    const error = await copies.waitFor('awc-clipboard-copy:error');

    expect(written).to.eql([]);
    expect(copies.types).to.eql(['awc-clipboard-copy:error']);
    expect((error.detail.error as DOMException).name).to.equal('NotFoundError');
  });

  it('copies only for the one pressed when the page has several', async () => {
    const written = stubClipboard();
    const container = await fixture<HTMLElement>(
      `<div>${clipboardCopyHtml('value="First"')}${clipboardCopyHtml('value="Second"')}</div>`,
    );
    const [first, second] = container.querySelectorAll('awc-clipboard-copy');
    const copies = recordCopies();

    first.click();
    second.click();
    await copies.waitFor('awc-clipboard-copy:copied');
    await copies.waitFor('awc-clipboard-copy:copied');

    expect(written).to.eql(['First', 'Second']);
  });

  describe('from the keyboard', () => {
    it('copies even when the page stops the key from propagating', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      el.parentElement!.addEventListener('keydown', (event) => event.stopPropagation(), { capture: true });
      const copies = recordCopies();

      dispatchKey(el, 'keydown', 'Enter');
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['Hello']);
    });

    it('copies when Enter is pressed', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const copies = recordCopies();

      dispatchKey(el, 'keydown', 'Enter');
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['Hello']);
    });

    it('copies when Space is released, not when it is pressed, and keeps the page from scrolling', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const copies = recordCopies();

      const press = dispatchKey(el, 'keydown', ' ');
      expect(press.defaultPrevented).to.equal(true);
      expect(written).to.eql([]);

      dispatchKey(el, 'keyup', ' ');
      await copies.waitFor('awc-clipboard-copy:copied');
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

      expect(written).to.eql([]);
    });

    it('copies when Enter or Space is pressed inside a shadow root', async () => {
      const written = stubClipboard();
      const host = await fixture<HTMLElement>('<div></div>');
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = clipboardCopyHtml('value="Hello"');
      const el = root.querySelector('awc-clipboard-copy')!;
      await whenSettled();
      const copies = recordCopies();

      dispatchKey(el, 'keydown', 'Enter');
      dispatchKey(el, 'keydown', ' ');
      dispatchKey(el, 'keyup', ' ');
      await copies.waitFor('awc-clipboard-copy:copied');
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['Hello', 'Hello']);
    });

    it('ignores keys pressed on its content', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      el.innerHTML = '<span>Copy</span>';
      const content = el.querySelector('span')!;

      dispatchKey(content, 'keydown', 'Enter');
      dispatchKey(content, 'keydown', ' ');
      dispatchKey(content, 'keyup', ' ');

      expect(written).to.eql([]);
    });
  });

  describe('when disabled', () => {
    it('ignores clicks and keys', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello" disabled');
      const copies = recordCopies();

      el.click();
      dispatchKey(el, 'keydown', 'Enter');
      dispatchKey(el, 'keydown', ' ');
      dispatchKey(el, 'keyup', ' ');

      expect(written).to.eql([]);
      expect(copies.types).to.eql([]);
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
      await whenSettled();
      expect(el.hasAttribute('tabindex')).to.equal(false);

      el.remove();
      el.disabled = false;
      parent.append(el);
      await whenSettled();
      expect(el.tabIndex).to.equal(0);
    });

    it('catches up with a disabled changed before it initialized', async () => {
      const container = await fixture<HTMLElement>('<div></div>');
      container.insertAdjacentHTML('beforeend', clipboardCopyHtml('value="Hello"'));
      container.insertAdjacentHTML('beforeend', '<awc-clipboard-copy value="Hello" disabled>Copy</awc-clipboard-copy>');
      const [disabledEarly, enabledEarly] = container.querySelectorAll('awc-clipboard-copy');
      disabledEarly.setAttribute('disabled', '');
      enabledEarly.removeAttribute('disabled');
      await whenSettled();

      expect(disabledEarly.hasAttribute('tabindex')).to.equal(false);
      expect(enabledEarly.tabIndex).to.equal(0);
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
      const copies = recordCopies();

      el.removeAttribute('disabled');
      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(written).to.eql(['Hello']);
    });
  });

  it('follows a morph to the server HTML as it is disabled and enabled again', async () => {
    const written = stubClipboard();
    const el = await clipboardCopyFixture('value="Hello"');
    const copies = recordCopies();

    Idiomorph.morph(el, `<awc-clipboard-copy disabled value="Hello">Copy</awc-clipboard-copy>`);
    el.click();
    expect(el.disabled).to.equal(true);
    expect(el.hasAttribute('tabindex')).to.equal(false);
    expect(written).to.eql([]);

    Idiomorph.morph(el, clipboardCopyHtml('value="Changed"'));
    el.click();
    await copies.waitFor('awc-clipboard-copy:copied');
    expect(el.tabIndex).to.equal(0);
    expect(written).to.eql(['Changed']);
  });

  describe('feedback state', () => {
    it('is copied for 2000ms by default after a copy', async () => {
      stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      expect(el.feedbackDuration).to.equal(2000);
      expect(feedback(el)).to.equal(null);
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');

      expect(feedback(el)).to.equal('copied');
    });

    it('ends once the feedback duration has passed', async () => {
      vi.useFakeTimers();
      stubClipboard();
      const el = await clipboardCopyFixture('value="Hello" feedback-duration="50"');
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');
      expect(feedback(el)).to.equal('copied');

      vi.advanceTimersByTime(50);
      expect(feedback(el)).to.equal(null);
    });

    it('is error when nothing was copied, in place of copied', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');
      expect(feedback(el)).to.equal('copied');

      el.removeAttribute('value');
      el.click();
      await copies.waitFor('awc-clipboard-copy:error');

      expect(written).to.eql(['Hello']);
      expect(feedback(el)).to.equal('error');
    });

    it('starts over on every press', async () => {
      vi.useFakeTimers();
      stubClipboard();
      const el = await clipboardCopyFixture('value="Hello" feedback-duration="200"');
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');
      vi.advanceTimersByTime(120);
      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');
      vi.advanceTimersByTime(120);
      // 240ms after the first press, but 120ms after the second.
      expect(feedback(el)).to.equal('copied');

      vi.advanceTimersByTime(80);
      expect(feedback(el)).to.equal(null);
    });

    it('ends when the element is removed from the page', async () => {
      stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const parent = el.parentElement!;
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');
      el.remove();
      parent.append(el);
      await whenSettled();

      expect(feedback(el)).to.equal(null);
    });

    it('is not entered when the element was removed before the copy finished', async () => {
      stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const parent = el.parentElement!;
      // On the element: a removed one's events don't reach the document.
      const copies = recordCopies(el);

      el.click();
      el.remove();
      await copies.waitFor('awc-clipboard-copy:copied');
      parent.append(el);
      await whenSettled();

      expect(feedback(el)).to.equal(null);
    });

    it('survives a morph, since no attribute holds it', async () => {
      stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const copies = recordCopies();

      el.click();
      await copies.waitFor('awc-clipboard-copy:copied');
      Idiomorph.morph(el, clipboardCopyHtml('value="Hello"'));

      expect(feedback(el)).to.equal('copied');
    });
  });

  describe('copy()', () => {
    it('copies as a press does: emits copied and enters the feedback state, once it resolves', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello"');
      const copies = recordCopies();

      await el.copy();

      expect(written).to.eql(['Hello']);
      expect(summary(copies)).to.eql([{ type: 'awc-clipboard-copy:copied', detail: { text: 'Hello' } }]);
      expect(feedback(el)).to.equal('copied');
    });

    it('copies even when disabled, which only stops presses', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('value="Hello" disabled');

      await el.copy();

      expect(written).to.eql(['Hello']);
    });

    it('resolves rather than rejects when nothing was copied, and emits error', async () => {
      stubClipboard(new DOMException('Write permission denied.', 'NotAllowedError'));
      const el = await clipboardCopyFixture('value="Hello"');
      const copies = recordCopies();

      await el.copy();

      expect(copies.types).to.eql(['awc-clipboard-copy:error']);
      expect(feedback(el)).to.equal('error');
    });

    it('finds no copy source while the element is removed from the page', async () => {
      const written = stubClipboard();
      const el = await clipboardCopyFixture('for="source"', '<input id="source" value="From input">');
      const errors = recordEvents(el, ['awc-clipboard-copy:error']);

      el.remove();
      await el.copy();

      expect(written).to.eql([]);
      expect(errors.events.map((event) => (event.detail.error as DOMException).name)).to.eql(['NotFoundError']);
    });
  });
});
