import debounce from 'src/helpers/debounce';
import AwcAutocompleteElement from './index';

export default class RemoteSearch {
  readonly autocomplete: AwcAutocompleteElement;
  private abortController?: AbortController;

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
    this.search('');
  }

  stop() {
    //
  }

  private async makeRequest(value: string) {
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
        this.autocomplete.optionsContainer.innerHTML = await response.text();
        this.autocomplete.checkIfListIsEmpty();
        this.autocomplete.combobox.initializeOptions();
        this.abortController = undefined;
        // Update the floating UI position after the listbox content has been updated.
        this.autocomplete.reposition();
        // Start the select variant to select the option(s).
        this.autocomplete.selectVariant.start();
      } else {
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.abortController = undefined;
        this.autocomplete.setAttribute('error', '');
      }
    } finally {
      this.autocomplete.removeAttribute('loading');
    }
  }
}
