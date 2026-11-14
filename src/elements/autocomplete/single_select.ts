import type AwcAutocompleteElement from './index';
import type { SelectVariant } from './index';

/**
 * A single select's selection. It is kept in one place only: the hidden field the form submits. The input's text, the
 * options' `aria-selected` and the element's selected class all follow from it.
 */
export default class SingleSelect implements SelectVariant {
  readonly autocomplete: AwcAutocompleteElement;
  /** What `reset` restores: the selection the element connected with. */
  private defaultValue = '';
  private defaultText = '';

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    this.defaultValue = this.value;
    this.defaultText = this.hiddenField.getAttribute('data-text') ?? '';
  }

  get value() {
    return this.hiddenField.value;
  }

  start() {
    this.markSelectedOption();
    const option = this.selectedOption ?? this.autocomplete.visibleOptions[0];
    if (option) {
      this.autocomplete.combobox.activate(option, { scroll: true });
    }
  }

  stop() {
    const { text } = this.hiddenField.dataset;
    this.autocomplete.input.value = text ?? '';
  }

  reset() {
    this.setValue(this.defaultValue, this.defaultText);
  }

  select(option: HTMLElement) {
    const value = option.getAttribute('value') ?? '';
    const { text } = option.dataset;
    this.setValue(value, text || '');
    this.autocomplete.requestHide();
  }

  setValue(value: string, text: string) {
    this.hiddenField.value = value;
    const trimmedText = text.trim();
    this.hiddenField.setAttribute('data-text', trimmedText);
    this.autocomplete.input.value = trimmedText;
    this.autocomplete.toggleSelectedClass(!!value);
    // Only while open: the options are all deselected while it is closed, and `start` selects the option on opening.
    if (!this.autocomplete.open) return;

    this.markSelectedOption();
  }

  clear() {
    this.setValue('', '');
  }

  /**
   * A single select holds at most one value, so there is nothing to match the argument against: whatever is selected
   * is the value being removed.
   */
  removeValue(_value: string) {
    this.clear();
  }

  isSelected(value: string) {
    return this.value === value;
  }

  // eslint-disable-next-line accessor-pairs
  set required(value: boolean) {
    this.autocomplete.input.required = value;
  }

  /** Leaves the option that has the value as the only selected option. */
  private markSelectedOption() {
    const selected = this.selectedOption;
    for (const option of this.autocomplete.options) {
      this.autocomplete.markSelected(option, option === selected);
    }
  }

  private get selectedOption() {
    return this.autocomplete.options.find((o) => o.getAttribute('value') === this.value);
  }

  private get hiddenField() {
    return this.autocomplete.querySelector<HTMLInputElement>('input[data-behavior="hidden-field"]')!;
  }
}
