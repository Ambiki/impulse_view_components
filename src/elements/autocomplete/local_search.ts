import AwcAutocompleteElement from './index';

export default class LocalSearch {
  readonly autocomplete: AwcAutocompleteElement;

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  search(value: string) {
    this.autocomplete.options.forEach(filterOptions(value));
    const firstOption = this.autocomplete.visibleOptions[0];
    if (firstOption) {
      this.autocomplete.combobox.activate(firstOption);
    }

    this.autocomplete.checkIfListIsEmpty();
  }

  start() {
    this.autocomplete.checkIfListIsEmpty();
  }

  stop() {
    this.resetOptions();
  }

  private resetOptions() {
    for (const option of this.autocomplete.options) {
      option.hidden = false;
    }
  }
}

function filterOptions(query: string) {
  return (option: HTMLElement) => {
    if (query) {
      const text = option.getAttribute('data-text') ?? '';
      const match = text.toLowerCase().includes(query.toLowerCase());
      option.hidden = !match;
    } else {
      option.hidden = false;
    }
  };
}
