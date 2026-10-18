import type { Cancelable } from 'src/helpers/debounce';
import type { AjaxEventName } from './events';
import type AwcAutocompleteElement from './index';
import type { SearchVariant } from './index';
import debounce from 'src/helpers/debounce';
import { AJAX_EVENT_INIT } from './events';

export default class AjaxSearch implements SearchVariant {
  readonly autocomplete: AwcAutocompleteElement;
  private abortController?: AbortController;
  private cachedOptions: string = '';
  // Held in its own field rather than assigned back over `makeRequest`, which would erase `Cancelable` from its type
  // and leave no way to cancel a request that is still waiting out the debounce.
  private readonly debouncedRequest: ((value: string) => void) & Cancelable;

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
    this.debouncedRequest = debounce((value: string) => this.makeRequest(value), 300);
  }

  search(value: string) {
    this.autocomplete.setAttribute('loading', '');
    this.autocomplete.removeAttribute('error');
    // The options on show, and any still on their way, are for an older query until the ones for `value` arrive, so
    // none of them may be active for a commit. A typed key already deactivates through the combobox, but a paste sends
    // no keydown it handles. The controller stays, as the request's `loadstart` still waits for its `loadend`.
    this.autocomplete.combobox.deactivate();
    this.abortController?.abort();
    this.debouncedRequest(value);
  }

  start() {
    if (this.cachedOptions) {
      this.insertOptions(this.cachedOptions, { cached: true });
    } else {
      this.search('');
    }
  }

  stop() {
    //
  }

  disconnected() {
    const wasRequesting = Boolean(this.abortController);
    this.debouncedRequest.clear();
    this.abortController?.abort();
    this.abortController = undefined;
    // An aborted request returns early without clearing up after itself, and no later request will arrive to do it
    // either. `search` sets `loading` before the request is even made, so it has to go whether or not one went out.
    this.autocomplete.removeAttribute('loading');
    // Only pair a `loadstart` that was actually emitted — during the debounce window, none has been.
    if (wasRequesting) {
      this.emit('loadend');
    }
  }

  private async makeRequest(value: string) {
    this.emit('loadstart');
    this.abortController?.abort();
    const { signal } = (this.abortController = new AbortController());

    const url = new URL(this.autocomplete.src, window.location.href);
    const params = new URLSearchParams(url.search.slice(1));
    params.append(this.autocomplete.param, value);
    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        signal,
        credentials: 'same-origin',
        headers: {
          accept: 'text/fragment+html',
        },
      });

      if (response.ok) {
        const options = await response.text();
        if (value === '') {
          this.cachedOptions = options;
        }
        await this.insertOptions(options);
        this.abortController = undefined;
        this.emit('load');

        this.autocomplete.removeAttribute('loading');
        this.emit('loadend');
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      this.abortController = undefined;
      // Closing clears `error`, so a request that fails after the listbox closed leaves it off.
      if (this.autocomplete.open) {
        this.autocomplete.setAttribute('error', '');
      }
      this.emit('error');
      this.autocomplete.removeAttribute('loading');
      this.emit('loadend');
    }
  }

  private async insertOptions(options: string, { cached = false } = {}) {
    this.autocomplete.optionsContainer.innerHTML = options;
    if (!cached) {
      this.autocomplete.combobox.initializeOptions();
    }
    // The response can land after the listbox closed, which deselected and deactivated every option and cleared
    // `no-options`. Opening it again does all three afresh.
    if (!this.autocomplete.open) return;

    this.autocomplete.checkIfListIsEmpty();
    // Start the select variant to select the option(s).
    this.autocomplete.selectVariant.start();
    // Update the floating UI position after the listbox content has been updated.
    await this.autocomplete.reposition();
  }

  private emit(name: AjaxEventName) {
    this.autocomplete.emit(name, AJAX_EVENT_INIT);
  }
}
