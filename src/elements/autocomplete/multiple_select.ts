import { getText, getValue } from './helpers';
import type AwcAutocompleteElement from './index';

export default class MultipleSelect {
  private selectedValues = new Set<string>();
  private defaultSelectedValues: Array<{ value: string; text: string }> = [];

  constructor(private readonly autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    const values = parseJSON(this.autocomplete.value);
    values.forEach((value) => this.selectedValues.add(value));
    this.defaultSelectedValues = this.persistedTags.map((tag) => ({ value: getValue(tag), text: getText(tag) }));
  }

  disconnected() {
    this.clear();
    this.defaultSelectedValues.length = 0;
  }

  start() {
    for (const option of this.autocomplete.options) {
      if (this.selectedValues.has(getValue(option))) {
        this.autocomplete.combobox.select(option);
      } else {
        this.autocomplete.combobox.deselect(option);
      }
    }
  }

  stop() {
    this.clearInputField();
  }

  async commit(option: HTMLElement) {
    this.clearInputField();
    const value = getValue(option);
    const text = getText(option);

    if (this.selectedValues.has(value)) {
      this.removeValue(value);
    } else {
      this.setValue(value, text);
    }

    if (this.autocomplete.src) {
      await this.autocomplete.makeRequest('');
      // Select the options and activate the most viable option.
      this.start();
      const activeOption =
        this.autocomplete.visibleOptions.find((o) => getValue(o) === value) || this.autocomplete.visibleOptions[0];
      if (activeOption) {
        this.autocomplete.activate(activeOption);
      }
    } else {
      for (const option of this.autocomplete.options) {
        option.hidden = false;
      }
    }
  }

  clear() {
    this.selectedValues.forEach((value) => this.removeValue(value));
  }

  reset() {
    this.clear();
    this.defaultSelectedValues.forEach(({ value, text }) => this.setValue(value, text, { persisted: true }));
  }

  setValue(value: string, text: string, { persisted = false } = {}) {
    if (this.selectedValues.has(value)) return;
    this.selectedValues.add(value);
    this.insertTag(value, text, { persisted });
    this.updateElementValue();

    // Only select if the listbox is open because all options are deselected when it is hidden.
    if (this.autocomplete.open) {
      const option = this.autocomplete.options.find((option) => getValue(option) === value);
      if (option) {
        this.autocomplete.combobox.select(option);
      }
    }
  }

  removeValue(value: string) {
    if (!this.selectedValues.has(value)) return;
    this.selectedValues.delete(value);
    this.removeTag(value);
    this.updateElementValue();

    const option = this.autocomplete.options.find((option) => getValue(option) === value);
    if (option) {
      this.autocomplete.combobox.deselect(option);
    }
  }

  private insertTag(value: string, text: string, { persisted = false } = {}): void {
    const templateClone = this.template.content.cloneNode(true) as HTMLElement;
    const tagField = templateClone.querySelector<HTMLElement>('[data-behavior="tag"]');
    const tagText = templateClone.querySelector<HTMLElement>('[data-behavior="text"]');
    const tagHiddenField = templateClone.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]');
    tagField?.setAttribute('value', value);
    tagField?.toggleAttribute('data-persisted', persisted);
    if (tagText) tagText.innerText = text;
    if (tagHiddenField) tagHiddenField.value = value;

    this.autocomplete.control.insertBefore(templateClone, this.template);
  }

  private removeTag(value: string) {
    const tag = this.tags.find((t) => getValue(t) === value);
    tag?.remove();
  }

  private updateElementValue(): void {
    const values = Array.from(this.selectedValues.values());
    this.autocomplete.value = JSON.stringify(values);
  }

  private clearInputField() {
    if (this.autocomplete.input.value) {
      this.autocomplete.input.value = '';
    }
  }

  get firstActiveOption(): HTMLElement | undefined {
    const option = this.autocomplete.visibleOptions.find((option) => this.selectedValues.has(getValue(option)));
    return option || this.autocomplete.visibleOptions[0];
  }

  get tags() {
    return Array.from(this.autocomplete.querySelectorAll<HTMLElement>('[data-behavior="tag"]'));
  }

  get persistedTags() {
    return this.tags.filter((tag) => tag.hasAttribute('data-persisted'));
  }

  private get template() {
    return this.autocomplete.querySelector<HTMLTemplateElement>('[data-behavior="tag-template"]')!;
  }
}

function parseJSON(value: string): string[] {
  try {
    const parsedValue = JSON.parse(value) as string[];
    return parsedValue.map((e) => e.toString());
  } catch {
    return [];
  }
}
