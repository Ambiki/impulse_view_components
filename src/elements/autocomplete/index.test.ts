import { aTimeout, expect, fixture, nextFrame, oneEvent, waitUntil } from '@open-wc/testing';
// Registers `awc-autocomplete`. Kept separate from the type import below, which the bundler elides.
import './index';
import type AwcAutocompleteElement from './index';

type FixtureOptions = {
  src?: string;
  multiple?: boolean;
  options?: Array<{ value: string; text: string }>;
};

/**
 * Mirrors the structure of `app/components/impulse/autocomplete_component.html.erb`. Only the parts the element reads
 * are reproduced here: the targets, the `data-behavior` hooks and the actions.
 */
function autocompleteHtml({ src, multiple = false, options = [] }: FixtureOptions = {}) {
  const optionsHtml = options
    .map(
      ({ value, text }) =>
        `<div role="option" tabindex="-1" value="${value}" data-text="${text}" aria-selected="false">${text}</div>`
    )
    .join('');

  const selection = multiple
    ? `<input type="hidden" data-behavior="hidden-field" value="">
       <template data-behavior="tag-template">
         <div class="awc-autocomplete-tag" data-behavior="tag">
           <span data-behavior="text"></span>
           <button type="button" data-action="click->awc-autocomplete#handleTagRemove" data-target="awc-autocomplete.tagDismissButtons"></button>
           <input type="hidden" data-behavior="hidden-field">
         </div>
       </template>`
    : `<input type="hidden" data-behavior="hidden-field" value="" data-text="">`;

  return `
    <awc-autocomplete ${multiple ? 'multiple' : ''} ${src ? `src="${src}"` : ''}
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
  // `connected` runs asynchronously, and sets this attribute once the targets and actions are wired up.
  await waitUntil(() => el.hasAttribute('data-impulse-element'));
  return el;
}

type FetchStub = {
  /** The urls that have been requested, in order. */
  urls: string[];
  /** The signal of the most recent request. */
  signal?: AbortSignal;
};

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

  describe('events', () => {
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
