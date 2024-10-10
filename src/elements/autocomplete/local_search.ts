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
    for (const group of this.autocomplete.groups) {
      group.hidden = false;
    }

    for (const option of this.autocomplete.options) {
      option.hidden = false;
    }
  }
}

function filterOptions(query: string) {
  return (option: HTMLElement) => {
    const group = option.closest<HTMLElement>('[role="group"]');
    if (query) {
      const value = option.getAttribute('data-text');
      const match = value?.toLowerCase().includes(query.toLowerCase());
      option.hidden = !match;
      if (group) {
        const options = Array.from(group.querySelectorAll<HTMLElement>('[role="option"]'));
        group.hidden = options.every((o) => o.hidden);
      }
    } else {
      option.hidden = false;
      if (group) {
        group.hidden = false;
      }
    }
  };
}
