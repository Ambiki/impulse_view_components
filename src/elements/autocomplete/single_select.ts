import { getText, getValue } from './helpers';
import type AwcAutocompleteElement from './index';

export default class SingleSelect {
  private defaultValue: string = '';
  private defaultText: string = '';

  constructor(private readonly autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    // Store value and text attribute so that we can restore it when the parent form fires a `reset` event.
    this.defaultValue = this.hiddenField.value;
    this.defaultText = this.hiddenField.getAttribute('data-text') || '';
  }

  disconnected() {
    this.clear();
    this.defaultValue = '';
    this.defaultText = '';
  }

  start() {
    if (this.selectedOption) {
      this.autocomplete.combobox.select(this.selectedOption);
    }
  }

  // Reset input field.
  stop() {
    this.autocomplete.input.value = this.hiddenField.getAttribute('data-text') || '';
  }

  commit(option: HTMLElement) {
    const value = getValue(option);
    const text = getText(option);
    this.setValue(value, text);
    this.autocomplete.open = false;
  }

  clear() {
    this.setValue('', '');
  }

  reset() {
    this.setValue(this.defaultValue, this.defaultText);

    // Only select if the listbox is open because all options are deselected when it is hidden.
    if (this.autocomplete.open) {
      const option = this.autocomplete.options.find((option) => getValue(option) === this.defaultValue);
      if (option) {
        this.autocomplete.combobox.select(option);
      }
    }
  }

  setValue(value: string, text: string) {
    this.autocomplete.value = value;
    this.autocomplete.input.value = text;
    this.hiddenField.value = value;
    if (!text) {
      this.hiddenField.removeAttribute('data-text');
      return;
    }
    this.hiddenField.setAttribute('data-text', text);
  }

  setRequiredAttribute(value: boolean) {
    this.autocomplete.input.required = value;
  }

  get firstActiveOption(): HTMLElement | undefined {
    return this.selectedOption || this.autocomplete.visibleOptions[0];
  }

  private get selectedOption() {
    return this.autocomplete.options.find((option) => this.isSelected(option));
  }

  private isSelected(option: HTMLElement) {
    return getValue(option) === this.autocomplete.value;
  }

  get hiddenField() {
    return this.autocomplete.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]')!;
  }
}
