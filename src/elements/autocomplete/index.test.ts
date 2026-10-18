import type { AutocompleteEventName } from './events';
import type AwcAutocompleteElement from './index';
import { whenInitialized } from '@ambiki/impulse';
import { aTimeout, expect, fixture, nextFrame, oneEvent, waitUntil } from '@open-wc/testing';
// Registers `awc-autocomplete`. Kept separate from the type import above, which the bundler elides.
import './index';

interface Option {
  value: string;
  text: string;
}

interface FixtureOptions {
  src?: string;
  multiple?: boolean;
  open?: boolean;
  options?: Option[];
  /** What the server rendered as selected: at most one option for a single select, a tag each for a multiple select. */
  selected?: Option[];
  /** Further attributes for the element, such as `required` or `param="term"`. */
  attributes?: string;
}

const FRUITS: Option[] = [
  { value: '1', text: 'Apple' },
  { value: '2', text: 'Banana' },
  { value: '3', text: 'Cherry' },
];

/** Mirrors `app/components/impulse/autocomplete/option_component.html.erb`. */
function optionsHtml(options: Option[]) {
  return options
    .map(
      ({ value, text }) =>
        `<div role="option" tabindex="-1" value="${value}" data-text="${text}" aria-selected="false">${text}</div>`,
    )
    .join('');
}

/** A tag the server rendered for a value that was already selected. */
function persistedTagHtml({ value, text }: Option) {
  return `
    <div class="awc-autocomplete-tag" value="${value}" data-text="${text}" data-behavior="tag" data-persisted>
      <span data-behavior="text">${text}</span>
      <button type="button" data-action="click->awc-autocomplete#handleTagRemove" data-target="awc-autocomplete.tagDismissButtons"></button>
      <input type="hidden" data-behavior="hidden-field" value="${value}" data-text="${text}">
    </div>
  `;
}

/**
 * Mirrors the structure of `app/components/impulse/autocomplete_component.html.erb`. Only the parts the element reads
 * are reproduced here: the targets, the `data-behavior` hooks and the actions.
 */
function autocompleteHtml({
  src,
  multiple = false,
  open = false,
  options = [],
  selected = [],
  attributes = '',
}: FixtureOptions = {}) {
  const [singleSelection] = selected;
  const selection = multiple ?
    `<input type="hidden" data-behavior="hidden-field" value="">
       ${selected.map(persistedTagHtml).join('')}
       <template data-behavior="tag-template">
         <div class="awc-autocomplete-tag" data-behavior="tag">
           <span data-behavior="text"></span>
           <button type="button" data-action="click->awc-autocomplete#handleTagRemove" data-target="awc-autocomplete.tagDismissButtons"></button>
           <input type="hidden" data-behavior="hidden-field">
         </div>
       </template>` :
    `<input type="hidden" data-behavior="hidden-field" value="${singleSelection?.value ?? ''}" data-text="${singleSelection?.text ?? ''}">`;

  return `
    <awc-autocomplete ${multiple ? 'multiple' : ''} ${open ? 'open' : ''} ${src ? `src="${src}"` : ''} ${attributes}
      data-action="mousedown->awc-autocomplete#handleMousedown click->awc-autocomplete#handleClick combobox:commit->awc-autocomplete#handleCommit">
      <div class="awc-autocomplete-control" data-target="awc-autocomplete.control" data-trigger>
        ${selection}
        <input class="awc-autocomplete-input" type="text" autocomplete="off" value="${multiple ? '' : (singleSelection?.text ?? '')}"
          data-target="awc-autocomplete.input"
          data-action="mousedown->awc-autocomplete#handleInputMousedown blur->awc-autocomplete#handleInputBlur keydown->awc-autocomplete#handleInputKeydown input->awc-autocomplete#handleInput">
        <div class="awc-autocomplete-end-adornment" data-trigger>
          <button type="button" data-action="click->awc-autocomplete#handleClear" data-target="awc-autocomplete.clearButton"></button>
        </div>
      </div>
      <div role="listbox" tabindex="-1" data-target="awc-autocomplete.listbox">
        <div role="presentation" data-target="awc-autocomplete.optionsContainer">${optionsHtml(options)}</div>
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
const VALUE_EVENTS = ['commit', 'remove', 'clear', 'reset'] as const;

/**
 * Records, in order, the `awc-autocomplete:<name>` events `el` dispatches, for each of `names`. By default, the open,
 * close, `clear` and `reset` events.
 */
function recordEvents(
  el: AwcAutocompleteElement,
  names: readonly AutocompleteEventName[] = [...OPEN_CLOSE_EVENTS, 'clear', 'reset'],
) {
  const events: string[] = [];
  for (const name of names) {
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

/** Commits `option` the way a user does, by clicking it, and resolves with the `commit` event it emits. */
function commit(el: AwcAutocompleteElement, option: HTMLElement) {
  setTimeout(() => option.click());
  return oneEvent(el, 'awc-autocomplete:commit');
}

/** Presses `key` in the input, and returns the `keydown` event so that callers can tell whether it was prevented. */
function pressKey(el: AwcAutocompleteElement, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  el.input.dispatchEvent(event);
  return event;
}

/** Types `text` into the input, replacing what it holds. */
function type(el: AwcAutocompleteElement, text: string) {
  el.input.value = text;
  el.input.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

/** Presses and releases `element` the way a mouse does, so that outside click handling sees the click too. */
function press(element: HTMLElement) {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  element.click();
}

describe('AwcAutocompleteElement', () => {
  const originalFetch = window.fetch;

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('ajax source lifecycle', () => {
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

    it('should report a committed option as selected in a single select', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });

      el.show();
      await nextFrame();
      const event = await commit(el, el.options[0]);

      expect(event.detail.selected).to.equal(true);
    });

    it('should emit a commit event for the option a single select already has selected', async () => {
      const el = await autocompleteFixture({ options: [{ value: '1', text: 'One' }] });
      el.setValue('1');

      el.show();
      await nextFrame();
      const event = await commit(el, el.options[0]);

      expect(el.value).to.equal('1');
      expect(event.detail.selected).to.equal(true);
    });

    it('should report whether a commit selected or deselected the option in a multiple select', async () => {
      const el = await autocompleteFixture({ multiple: true, options: [{ value: '1', text: 'One' }] });

      el.show();
      await nextFrame();
      const selectEvent = await commit(el, el.options[0]);
      const deselectEvent = await commit(el, el.options[0]);

      expect(selectEvent.detail.selected).to.equal(true);
      expect(deselectEvent.detail.selected).to.equal(false);
      expect(el.value).to.eql([]);
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

  describe('selection API in a single select', () => {
    it('should select a value, reading its text from the option', async () => {
      const el = await autocompleteFixture({ options: FRUITS });

      el.setValue('2');

      expect(el.value).to.equal('2');
      expect(el.input.value).to.equal('Banana');
      expect(el).to.have.class('awc-autocomplete--selected');
    });

    it('should select a value that has no option, with the text it is given', async () => {
      const el = await autocompleteFixture({ options: FRUITS });

      el.setValue('9', '  Fig ');

      expect(el.value).to.equal('9');
      expect(el.input.value).to.equal('Fig');
    });

    it('should select the option when a value is set while open', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });
      el.show();

      el.setValue('2');

      expect(el.options.map((option) => option.getAttribute('aria-selected'))).to.eql(['false', 'true', 'false']);
    });

    it('should deselect the option when the value is cleared while open', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });
      el.show();

      el.clear();

      expect(el.options.map((option) => option.getAttribute('aria-selected'))).to.eql(['false', 'false', 'false']);
    });

    it('should clear the value with `removeValue`', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });

      el.removeValue();

      expect(el.value).to.equal('');
      expect(el.input.value).to.equal('');
      expect(el).not.to.have.class('awc-autocomplete--selected');
    });

    it('should clear the value with `clear`', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });

      el.clear();

      expect(el.value).to.equal('');
      expect(el.input.value).to.equal('');
    });

    it('should restore the value the server rendered with `reset`', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });
      el.setValue('2');

      el.reset();

      expect(el.value).to.equal('1');
      expect(el.input.value).to.equal('Apple');
    });

    it('should emit no value events when the value changes from code', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });
      const events = recordEvents(el, VALUE_EVENTS);

      el.setValue('2');
      el.removeValue();
      el.clear();
      el.reset();

      expect(events).to.eql([]);
    });
  });

  describe('selection API in a multiple select', () => {
    /** The value and text of each tag, as the form submits the value and the user reads the text. */
    function tagsOf(el: AwcAutocompleteElement) {
      return el.tags.map((tag) => {
        const hiddenField = tag.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]')!;
        return { value: hiddenField.value, text: tag.querySelector('[data-behavior="text"]')!.textContent };
      });
    }

    it('should add a tag for each value, reading its text from the option', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS });

      el.setValue('1');
      el.setValue('9', 'Fig');

      expect(el.value).to.eql(['1', '9']);
      expect(tagsOf(el)).to.eql([{ value: '1', text: 'Apple' }, { value: '9', text: 'Fig' }]);
      expect(el).to.have.class('awc-autocomplete--selected');
    });

    it('should not add a second tag for a value that is already selected', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });

      el.setValue('1');

      expect(el.value).to.eql(['1']);
    });

    it('should select the option when a value is set while open', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS });
      el.show();

      el.setValue('2');

      expect(el.options[1].getAttribute('aria-selected')).to.equal('true');
    });

    it('should remove only the given value', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0], FRUITS[1]] });

      el.removeValue('1');

      expect(el.value).to.eql(['2']);
      expect(tagsOf(el)).to.eql([{ value: '2', text: 'Banana' }]);
    });

    it('should deselect the option when its value is removed while open', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });
      el.show();
      expect(el.options[0].getAttribute('aria-selected')).to.equal('true');

      el.removeValue('1');

      expect(el.options[0].getAttribute('aria-selected')).to.equal('false');
    });

    it('should ignore removing a value that is not selected', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });

      el.removeValue('2');

      expect(el.value).to.eql(['1']);
    });

    it('should remove every value with `clear`', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0], FRUITS[1]] });

      el.clear();

      expect(el.value).to.eql([]);
      expect(el.tags).to.have.length(0);
      expect(el).not.to.have.class('awc-autocomplete--selected');
    });

    it('should restore the tags the server rendered with `reset`', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0], FRUITS[1]] });
      el.removeValue('1');
      el.setValue('3');

      el.reset();

      expect(tagsOf(el)).to.eql([{ value: '1', text: 'Apple' }, { value: '2', text: 'Banana' }]);
    });

    it('should require the input only while no value is selected', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, attributes: 'required' });
      expect(el.input.required).to.equal(true);

      el.setValue('1');
      expect(el.input.required).to.equal(false);

      el.removeValue('1');
      expect(el.input.required).to.equal(true);
    });

    it('should emit no value events when the value changes from code', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });
      const events = recordEvents(el, VALUE_EVENTS);

      el.setValue('2');
      el.removeValue('1');
      el.clear();
      el.reset();

      expect(events).to.eql([]);
    });
  });

  describe('keyboard', () => {
    for (const key of ['Enter', 'Tab']) {
      it(`should commit the active option with ${key}`, async () => {
        const el = await autocompleteFixture({ options: FRUITS });
        pressInput(el);
        el.activate(el.options[1]);
        const committed = oneEvent(el, 'awc-autocomplete:commit');

        pressKey(el, key);

        expect((await committed).detail.value).to.equal('2');
        expect(el.value).to.equal('2');
        expect(el.open).to.equal(false);
      });
    }

    it('should keep Enter from submitting its form only while open', async () => {
      const el = await autocompleteFixture({ options: FRUITS });
      expect(pressKey(el, 'Enter').defaultPrevented).to.equal(false);

      pressInput(el);
      el.deactivate();

      expect(pressKey(el, 'Enter').defaultPrevented).to.equal(true);
    });

    it('should open with Alt+ArrowDown and close with Alt+ArrowUp', async () => {
      const el = await autocompleteFixture({ options: FRUITS });
      const events = recordEvents(el);

      pressKey(el, 'ArrowDown', { altKey: true });
      expect(el.open).to.equal(true);

      pressKey(el, 'ArrowUp', { altKey: true });
      await nextFrame();
      expect(el.open).to.equal(false);
      expect(events).to.eql(['show', 'shown', 'hide', 'hidden']);
    });

    it('should remove the last tag with Backspace while the input is empty', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0], FRUITS[1]] });
      const removed = oneEvent(el, 'awc-autocomplete:remove');

      const event = pressKey(el, 'Backspace');

      expect((await removed).detail.value).to.equal('2');
      expect(el.value).to.eql(['1']);
      expect(event.defaultPrevented).to.equal(true);
    });

    it('should leave the tags alone on Backspace while the input has text', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });
      const events = recordEvents(el, VALUE_EVENTS);
      el.input.value = 'Ch';

      const event = pressKey(el, 'Backspace');

      expect(el.value).to.eql(['1']);
      expect(event.defaultPrevented).to.equal(false);
      expect(events).to.eql([]);
    });

    it('should let Backspace through when there is no tag to remove', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS });
      const events = recordEvents(el, VALUE_EVENTS);

      const event = pressKey(el, 'Backspace');

      expect(event.defaultPrevented).to.equal(false);
      expect(events).to.eql([]);
    });
  });

  describe('pointer', () => {
    it('should request to hide when the user clicks outside it', async () => {
      const el = await autocompleteFixture({ options: FRUITS });
      el.show();
      const events = recordEvents(el);

      press(document.body);
      await nextFrame();

      expect(el.open).to.equal(false);
      expect(events).to.eql(['hide', 'hidden']);
    });

    it('should stay open when the user clicks inside its listbox', async () => {
      const el = await autocompleteFixture({ options: FRUITS });
      el.show();

      press(el.listbox);
      await nextFrame();

      expect(el.open).to.equal(true);
    });

    it('should mark an outside click that blurred the input as handled, unless it lands on something focusable', async () => {
      const container = await fixture<HTMLElement>(`
        <div>
          ${autocompleteHtml({ options: FRUITS })}
          <p>Text</p>
          <button type="button">Button</button>
        </div>
      `);
      const el = container.querySelector('awc-autocomplete')!;
      await whenInitialized(el);

      /** Clicks `target` while the listbox is open, blurring the input in between as a real click does. */
      function clickBlurring(target: HTMLElement) {
        pressInput(el);
        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.input.dispatchEvent(new FocusEvent('blur'));
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        target.dispatchEvent(click);
        return click;
      }

      expect(clickBlurring(container.querySelector('p')!).defaultPrevented).to.equal(true);
      expect(clickBlurring(container.querySelector('button')!).defaultPrevented).to.equal(false);
    });

    it('should select the text of the input on the first click, so that typing replaces it', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });

      el.input.click();
      expect([el.input.selectionStart, el.input.selectionEnd]).to.eql([0, 5]);

      el.input.setSelectionRange(2, 2);
      el.input.click();
      expect([el.input.selectionStart, el.input.selectionEnd]).to.eql([2, 2]);
    });
  });

  describe('disabled and required', () => {
    it('should disable its input and buttons when `disabled` changes', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });
      const controls = () => [el.input, el.clearButton!, ...el.tagDismissButtons].map((control) => control.disabled);

      el.disabled = true;
      expect(controls()).to.eql([true, true, true]);

      el.disabled = false;
      expect(controls()).to.eql([false, false, false]);
    });

    it('should not open when pressed or clicked while disabled', async () => {
      const el = await autocompleteFixture({ options: FRUITS, attributes: 'disabled' });

      pressInput(el);
      el.control.click();

      expect(el.open).to.equal(false);
    });

    it('should follow `required` changes in a single select', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });

      el.required = true;
      expect(el.input.required).to.equal(true);

      el.required = false;
      expect(el.input.required).to.equal(false);
    });
  });

  describe('closing after typing', () => {
    it('should put the selected option\'s text back in a single select', async () => {
      const el = await autocompleteFixture({ options: FRUITS, selected: [FRUITS[0]] });
      pressInput(el);
      type(el, 'Ch');

      await el.hide();

      expect(el.input.value).to.equal('Apple');
    });

    it('should empty the input in a multiple select', async () => {
      const el = await autocompleteFixture({ multiple: true, options: FRUITS, selected: [FRUITS[0]] });
      pressInput(el);
      type(el, 'Ch');

      await el.hide();

      expect(el.input.value).to.equal('');
    });
  });
});
