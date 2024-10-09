import type AwcAutocompleteElement from './index';

export default class SingleSelect {
  readonly autocomplete: AwcAutocompleteElement;
  private defaultValue = '';
  private defaultText = '';

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    this.defaultValue = this.hiddenField.value;
    this.defaultText = this.hiddenField.getAttribute('data-text') ?? '';
  }

  start() {
    if (this.selectedOption) {
      this.autocomplete.combobox.select(this.selectedOption);
      this.autocomplete.combobox.activate(this.selectedOption, { scroll: true });
    } else {
      const firstOption = this.autocomplete.visibleOptions[0];
      if (!firstOption) return;
      this.autocomplete.combobox.activate(firstOption, { scroll: true });
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
    this.autocomplete.hide();
  }

  setValue(value: string, text: string) {
    this.hiddenField.value = value;
    const trimmedText = text.trim();
    this.hiddenField.setAttribute('data-text', trimmedText);
    this.autocomplete.input.value = trimmedText;
    this.autocomplete.toggleSelectedClass(!!value);
  }

  clear() {
    this.setValue('', '');
  }

  private get selectedOption() {
    return this.autocomplete.options.find((o) => o.getAttribute('value') === this.autocomplete.value);
  }

  private get hiddenField() {
    return this.autocomplete.querySelector<HTMLInputElement>('input[data-behavior="hidden-field"]')!;
  }
}
