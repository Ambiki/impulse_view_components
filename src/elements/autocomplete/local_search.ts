import type AwcAutocompleteElement from './index';
import type { SearchVariant } from './index';

export default class LocalSearch implements SearchVariant {
  readonly autocomplete: AwcAutocompleteElement;

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  search(value: string) {
    filterOptions(this.autocomplete.options, value);
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

function filterOptions(options: HTMLElement[], query: string) {
  const normalizedQuery = query.toLowerCase();
  // Tracks whether each group has at least one visible option. We accumulate this in a single
  // pass instead of re-querying every group's options per option (which was O(n × group size)).
  const groupHasVisibleOption = new Map<HTMLElement, boolean>();

  for (const option of options) {
    const group = option.closest<HTMLElement>('[role="group"]');
    const match = normalizedQuery ? !!option.getAttribute('data-text')?.toLowerCase().includes(normalizedQuery) : true;
    option.hidden = !match;
    if (group) {
      groupHasVisibleOption.set(group, (groupHasVisibleOption.get(group) ?? false) || match);
    }
  }

  for (const [group, hasVisibleOption] of groupHasVisibleOption) {
    group.hidden = !hasVisibleOption;
  }
}
