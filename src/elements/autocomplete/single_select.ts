import { getText, getValue } from './helpers';
import type AwcAutocompleteElement from './index';

export default class SingleSelect {
  constructor(private readonly autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    //
  }

  disconnected() {
    this.clear();
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
    this.autocomplete.value = value;
    this.autocomplete.input.value = text;
    this.hiddenField.value = value;
    this.hiddenField.setAttribute('data-text', text);
    this.autocomplete.open = false;
  }

  clear() {
    this.autocomplete.value = '';
    this.autocomplete.input.value = '';
    this.hiddenField.value = '';
    this.hiddenField.removeAttribute('data-text');
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
