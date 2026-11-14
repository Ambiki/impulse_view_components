import type AwcAutocompleteElement from './index';
import type { OptionsChangeCallback, SearchVariant } from './index';

/** What the local search needs of the element: the options and groups on the page. */
type LocalSearchHost = Pick<AwcAutocompleteElement, 'options' | 'groups'>;

/** Options read from the page: it hides the ones the query doesn't match. */
export default class LocalSearch implements SearchVariant {
  /** Filtering is done as soon as it is asked for, so the options on show are never for an older query. */
  readonly pending = false;
  private readonly autocomplete: LocalSearchHost;
  private readonly onOptionsChange: OptionsChangeCallback;

  constructor(autocomplete: LocalSearchHost, onOptionsChange: OptionsChangeCallback) {
    this.autocomplete = autocomplete;
    this.onOptionsChange = onOptionsChange;
  }

  search(value: string) {
    filterOptions(this.autocomplete.options, value);
    this.onOptionsChange();
  }

  start() {
    // Nothing to fetch: the options are on the page.
  }

  stop() {
    this.resetOptions();
  }

  disconnected() {
    // Nothing outstanding: filtering the options in the DOM is synchronous.
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
