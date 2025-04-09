import debounce from 'src/helpers/debounce';
import AwcAutocompleteElement from './index';

export default class RemoteSearch {
  readonly autocomplete: AwcAutocompleteElement;
  private abortController?: AbortController;
  private cachedOptions: string = '';

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
    this.makeRequest = debounce(this.makeRequest.bind(this), 300);
  }

  async search(value: string) {
    this.autocomplete.setAttribute('loading', '');
    this.autocomplete.removeAttribute('error');
    await this.makeRequest(value);
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
      this.autocomplete.setAttribute('error', '');
      this.emit('error');
      this.autocomplete.removeAttribute('loading');
      this.emit('loadend');
    }
  }

  private async insertOptions(options: string, { cached = false } = {}) {
    this.autocomplete.optionsContainer.innerHTML = options;
    this.autocomplete.checkIfListIsEmpty();
    if (!cached) {
      this.autocomplete.combobox.initializeOptions();
    }
    // Start the select variant to select the option(s).
    this.autocomplete.selectVariant.start();
    // Update the floating UI position after the listbox content has been updated.
    await this.autocomplete.reposition();
  }

  private emit(name: string) {
    this.autocomplete.emit(name, { bubbles: false, prefix: false });
  }
}
