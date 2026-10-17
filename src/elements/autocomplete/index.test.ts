import type AwcAutocompleteElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { aTimeout, expect, fixture, nextFrame, oneEvent, waitUntil } from '@open-wc/testing';
// Registers `awc-autocomplete`. Kept separate from the type import above, which the bundler elides.
import './index';

interface FixtureOptions {
  src?: string;
  multiple?: boolean;
  open?: boolean;
  options?: Array<{ value: string; text: string }>;
}

/**
 * Mirrors the structure of `app/components/impulse/autocomplete_component.html.erb`. Only the parts the element reads
 * are reproduced here: the targets, the `data-behavior` hooks and the actions.
 */
function autocompleteHtml({ src, multiple = false, open = false, options = [] }: FixtureOptions = {}) {
  const optionsHtml = options
    .map(
      ({ value, text }) =>
        `<div role="option" tabindex="-1" value="${value}" data-text="${text}" aria-selected="false">${text}</div>`,
    )
    .join('');

  const selection = multiple ?
    `<input type="hidden" data-behavior="hidden-field" value="">
       <template data-behavior="tag-template">
         <div class="awc-autocomplete-tag" data-behavior="tag">
           <span data-behavior="text"></span>
           <button type="button" data-action="click->awc-autocomplete#handleTagRemove" data-target="awc-autocomplete.tagDismissButtons"></button>
           <input type="hidden" data-behavior="hidden-field">
         </div>
       </template>` :
    `<input type="hidden" data-behavior="hidden-field" value="" data-text="">`;

  return `
    <awc-autocomplete ${multiple ? 'multiple' : ''} ${open ? 'open' : ''} ${src ? `src="${src}"` : ''}
      data-action="mousedown->awc-autocomplete#handleMousedown click->awc-autocomplete#handleClick combobox:commit->awc-autocomplete#handleCommit">
      <div class="awc-autocomplete-control" data-target="awc-autocomplete.control" data-trigger>
        ${selection}
        <input class="awc-autocomplete-input" type="text" autocomplete="off"
          data-target="awc-autocomplete.input"
          data-action="mousedown->awc-autocomplete#handleInputMousedown blur->awc-autocomplete#handleInputBlur keydown->awc-autocomplete#handleInputKeydown input->awc-autocomplete#handleInput">
        <div class="awc-autocomplete-end-adornment" data-trigger>
          <button type="button" data-action="click->awc-autocomplete#handleClear" data-target="awc-autocomplete.clearButton"></button>
        </div>
      </div>
      <div role="listbox" tabindex="-1" data-target="awc-autocomplete.listbox">
        <div role="presentation" data-target="awc-autocomplete.optionsContainer">${optionsHtml}</div>
      </div>
    </awc-autocomplete>
  `;
}

async function autocompleteFixture(options: FixtureOptions = {}) {
  const el = await fixture<AwcAutocompleteElement>(autocompleteHtml(options));
  await whenInitialized(el);
  return el;
}

interface FetchStub {
  /** The urls that have been requested, in order. */
  urls: string[];
  /** The signal of the most recent request. */
  signal?: AbortSignal;
}

/**
 * Replaces `window.fetch` with a request that never resolves on its own and rejects with an `AbortError` once its
 * signal is aborted — the way a real request behaves. Aborting is the whole mechanism by which a response from an
 * abandoned source is prevented from landing, so there is no state in which a stale response can still arrive to
 * assert against.
 */
function stubFetch(): FetchStub {
  const stub: FetchStub = { urls: [] };

  window.fetch = ((url: string, init?: RequestInit) => {
    stub.urls.push(url);
    stub.signal = init?.signal ?? undefined;

    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    });
  }) as typeof window.fetch;

  return stub;
}

/**
 * Waits for the positioning observers' callbacks to have run, so that only the change under test can reposition.
 * Two frames are enough today; five leaves a margin.
 */
async function drainObservers() {
  for (let i = 0; i < 5; i++) await nextFrame();
}

const OPEN_CLOSE_EVENTS = ['show', 'shown', 'hide', 'hidden'] as const;

/** Records, in order, the `awc-autocomplete:*` open, close, `clear` and `reset` events `el` dispatches. */
function recordEvents(el: AwcAutocompleteElement) {
  const events: string[] = [];
  for (const name of [...OPEN_CLOSE_EVENTS, 'clear', 'reset'] as const) {
    el.addEventListener(`awc-autocomplete:${name}`, (event) => {
      if (event.target === el) events.push(name);
    });
  }
  return events;
}

/** Prevents the next `awc-autocomplete:<name>` event `el` dispatches. */
function preventNext(el: AwcAutocompleteElement, name: 'show' | 'hide') {
  el.addEventListener(`awc-autocomplete:${name}`, (event) => event.preventDefault(), { once: true });
}

/** Opens the listbox the way a user does, by pressing on the input. */
function pressInput(el: AwcAutocompleteElement) {
  el.input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1 }));
}

function pressKey(el: AwcAutocompleteElement, key: string) {
  el.input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('AwcAutocompleteElement', () => {
  const originalFetch = window.fetch;

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('remote source lifecycle', () => {
    it('should not issue a pending debounced request after `src` changes', async () => {
      const el = await autocompleteFixture({ src: '/a' });
      const fetchStub = stubFetch();

      el.show();
      el.src = '/b';
      // Longer than the 300ms debounce, so a request that was not cancelled would have been issued by now.
      await aTimeout(400);

      expect(fetchStub.urls).to.eql([]);
    });

    it('should not issue a pending debounced request after the element is removed', async () => {
      const el = await autocompleteFixture({ src: '/a' });
      const fetchStub = stubFetch();

      el.show();
      el.remove();
      await aTimeout(400);

      expect(fetchStub.urls).to.eql([]);
    });

    it('should abort the in-flight request when `src` changes', async () => {
      const el = await autocompleteFixture({ src: '/a' });
      const fetchStub = stubFetch();

      el.show();
      await waitUntil(() => fetchStub.urls.length === 1, 'the debounced request was never issued');
      expect(fetchStub.urls[0]).to.contain('/a?q=');

      el.src = '/b';
      expect(fetchStub.signal?.aborted).to.equal(true);

      // Abandoning a request is not a failure, and it must not leave the element stuck mid-flight.
      await aTimeout(50);
      expect(el).not.to.have.attribute('error');
      expect(el).not.to.have.attribute('loading');
    });
  });

  describe('auto size', () => {
    it('should follow `auto-size` changes made after it connects', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
      el.show();
      await el.reposition();
      expect(listbox.style.getPropertyValue('--awc-auto-size-height')).to.equal('');

      el.autoSize = true;
      await el.reposition();
      expect(listbox.style.getPropertyValue('--awc-auto-size-height')).to.match(/^\d+(\.\d+)?px$/);

      el.autoSize = false;
      await el.reposition();
      expect(listbox.style.getPropertyValue('--awc-auto-size-height')).to.equal('');
    });

    it('should apply `auto-size` straight away while it is open', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
      el.show();
      await drainObservers();

      el.autoSize = true;
      await nextFrame();

      expect(listbox.style.getPropertyValue('--awc-auto-size-height')).to.match(/^\d+(\.\d+)?px$/);
    });

    it('should apply `auto-size-padding` straight away while it is open', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
      const availableHeight = () => Number.parseFloat(listbox.style.getPropertyValue('--awc-auto-size-height'));
      el.autoSize = true;
      el.show();
      await drainObservers();
      const before = availableHeight();

      el.autoSizePadding = el.autoSizePadding + 16;
      await nextFrame();

      expect(availableHeight()).to.be.closeTo(before - 16, 0.5);
    });

    it('should clear `auto-size` when it is turned off while a reposition is still running', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
      el.show();
      await drainObservers();

      el.autoSize = true;
      el.autoSize = false;
      await drainObservers();

      expect(listbox.style.getPropertyValue('--awc-auto-size-height')).to.equal('');
    });
  });

  describe('events', () => {
    it('should emit only the state events when shown and hidden from code', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const events = recordEvents(el);
      preventNext(el, 'show');
      preventNext(el, 'hide');

      el.show();
      await el.hide();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['shown', 'hidden']);
    });

    it('should open and close when `open` changes, emitting only the state events', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const events = recordEvents(el);
      preventNext(el, 'show');
      preventNext(el, 'hide');

      el.open = true;
      expect(el.input.getAttribute('aria-expanded')).to.equal('true');

      el.removeAttribute('open');
      await nextFrame();

      expect(el.input.getAttribute('aria-expanded')).to.equal('false');
      expect(events).to.eql(['shown', 'hidden']);
    });

    it('should stay closed when the user opens it and `show` is prevented', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const events = recordEvents(el);
      preventNext(el, 'show');

      pressInput(el);
      expect(el.open).to.equal(false);

      pressInput(el);
      expect(el.open).to.equal(true);
      expect(events).to.eql(['show', 'show', 'shown']);
    });

    it('should stay open when the user closes it with Escape and `hide` is prevented', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      pressInput(el);
      const events = recordEvents(el);
      preventNext(el, 'hide');

      pressKey(el, 'Escape');
      expect(el.open).to.equal(true);

      pressKey(el, 'Escape');
      await nextFrame();
      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hide', 'hidden']);
    });

    it('should request to hide when the input loses focus', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      pressInput(el);
      const events = recordEvents(el);
      preventNext(el, 'hide');

      el.input.dispatchEvent(new FocusEvent('blur'));
      await nextFrame();

      expect(el.open).to.equal(true);
      expect(events).to.eql(['hide']);
    });

    it('should request to hide when an option is committed', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      pressInput(el);
      await nextFrame();
      const events = recordEvents(el);
      preventNext(el, 'hide');

      el.options[0].click();
      await nextFrame();

      expect(el.value).to.equal('1');
      expect(el.open).to.equal(true);
      expect(events).to.eql(['hide']);
    });

    it('should request to hide when cleared', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      pressInput(el);
      const events = recordEvents(el);
      preventNext(el, 'hide');

      el.clearButton!.click();
      await nextFrame();

      expect(el.open).to.equal(true);
      expect(events).to.eql(['hide', 'clear']);
    });

    it('should hide without a request when its form resets', async () => {
      const form = await fixture<HTMLFormElement>(`<form>${autocompleteHtml({ options: [{ value: '1', text: 'One' }] })}</form>`);
      const el = form.querySelector('awc-autocomplete')!;
      await whenInitialized(el);
      pressInput(el);
      const events = recordEvents(el);
      preventNext(el, 'hide');

      form.reset();
      await nextFrame();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['reset', 'hidden']);
    });

    it('should close silently when removed, keeping `open`', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      pressInput(el);
      const { input } = el;
      const events = recordEvents(el);

      el.remove();
      await nextFrame();

      expect(el.open).to.equal(true);
      expect(input.getAttribute('aria-expanded')).to.equal('false');
      expect(events).to.eql([]);
    });

    it('should open again silently when reconnected', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const parent = el.parentElement!;
      pressInput(el);
      el.remove();
      await nextFrame();
      const events = recordEvents(el);

      parent.append(el);
      await whenInitialized(el);

      expect(el.input.getAttribute('aria-expanded')).to.equal('true');
      expect(events).to.eql([]);
    });

    it('should stay closed when hidden while removed', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      const parent = el.parentElement!;
      pressInput(el);
      el.remove();
      await nextFrame();
      const events = recordEvents(el);

      await el.hide();
      parent.append(el);
      await whenInitialized(el);

      expect(el.open).to.equal(false);
      expect(el.input.getAttribute('aria-expanded')).to.equal('false');
      expect(events).to.eql([]);
    });

    it('should emit nothing when asked to hide while removed', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      pressInput(el);
      el.remove();
      await nextFrame();
      const events = recordEvents(el);

      await el.requestHide();

      expect(events).to.eql([]);
    });

    it('should open silently once it connects when shown before', async () => {
      const container = await fixture<HTMLElement>('<div></div>');
      container.innerHTML = autocompleteHtml({ options: [{ value: '1', text: 'One' }] });
      const el = container.querySelector('awc-autocomplete')!;
      const events = recordEvents(el);

      el.show();
      await whenInitialized(el);

      expect(el.input.getAttribute('aria-expanded')).to.equal('true');
      expect(events).to.eql([]);
    });

    it('should open silently when it connects with `open` set', async () => {
      const events: string[] = [];
      for (const name of OPEN_CLOSE_EVENTS) {
        document.addEventListener(`awc-autocomplete:${name}`, () => events.push(name), { once: true });
      }

      const el = await autocompleteFixture({ open: true, options: [{ value: '1', text: 'One' }] });

      expect(el.input.getAttribute('aria-expanded')).to.equal('true');
      expect(events).to.eql([]);
    });

    it('should emit a commit event carrying the option, its value and its text', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });

      el.show();
      await nextFrame();
      const option = el.options[0];
      setTimeout(() => option.click());
      const event = await oneEvent(el, 'awc-autocomplete:commit');

      expect(event.detail.target).to.equal(option);
      expect(event.detail.value).to.equal('1');
      expect(event.detail.text).to.equal('One');
    });

    it('should emit a remove event carrying the tag, its value and its text', async () => {
      const el = await autocompleteFixture({ multiple: true, options: [{ value: '1', text: 'One' }] });

      el.show();
      await nextFrame();
      el.options[0].click();
      await nextFrame();

      const tag = el.tags[0];
      expect(tag).to.exist;
      const dismissButton = tag.querySelector('button')!;
      setTimeout(() => dismissButton.click());
      const event = await oneEvent(el, 'awc-autocomplete:remove');

      expect(event.detail.target).to.equal(tag);
      expect(event.detail.value).to.equal('1');
      expect(event.detail.text).to.equal('One');
    });
  });
});
