import type AwcAutocompleteElement from './index';

type TDefaultSelectedValue = { value: string; text: string };

export default class MultipleSelect {
  readonly autocomplete: AwcAutocompleteElement;
  private selectedValues = new Set<string>();
  private defaultSelectedValues: Array<TDefaultSelectedValue> = [];

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    this.defaultSelectedValues = this.tags.reduce<Array<TDefaultSelectedValue>>((array, tag) => {
      const hiddenField = tag.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]')!;
      const value = hiddenField.value;
      this.selectedValues.add(value);
      array.push({ value, text: hiddenField.getAttribute('data-text') || '' });
      return array;
    }, []);
  }

  start() {
    this.selectOrDeselectOptions();
    if (this.firstActivableOption) {
      this.autocomplete.combobox.activate(this.firstActivableOption, { scroll: true });
    }
  }

  stop() {
    this.autocomplete.input.value = '';
  }

  reset() {
    this.clear();
    this.defaultSelectedValues.forEach(({ value, text }) => this.setValue(value, text));
  }

  select(option: HTMLElement) {
    const value = option.getAttribute('value');
    const { text } = option.dataset;
    if (!value) return;

    if (this.selectedValues.has(value)) {
      this.removeValue(value);
    } else {
      this.setValue(value, text || '');
    }
  }

  setValue(value: string, text: string) {
    if (this.selectedValues.has(value)) return;
    this.selectedValues.add(value);
    this.insertTag(value, text.trim());
    // Only select the option if autocomplete is open, otherwise leave it as it is because aria-selected will be
    // "false" when the autocomplete is hidden.
    if (!this.autocomplete.open) return;

    const option = this.autocomplete.options.find(this.findByValue(value));
    if (option) {
      this.autocomplete.combobox.select(option);
    }
  }

  clear() {
    this.selectedValues.forEach((value) => this.removeValue(value));
  }

  removeValue(value: string) {
    if (!this.selectedValues.has(value)) return;
    this.selectedValues.delete(value);
    this.removeTag(value);
    const option = this.autocomplete.options.find(this.findByValue(value));
    if (option) {
      this.autocomplete.combobox.deselect(option);
    }
  }

  private selectOrDeselectOptions() {
    for (const option of this.autocomplete.options) {
      const value = option.getAttribute('value');
      if (value && this.selectedValues.has(value)) {
        this.autocomplete.combobox.select(option);
      } else {
        this.autocomplete.combobox.deselect(option);
      }
    }
  }

  private insertTag(value: string, text: string): void {
    const templateClone = this.template.content.cloneNode(true) as HTMLElement;
    const tagField = templateClone.querySelector<HTMLElement>('[data-behavior="tag"]')!;
    const tagText = templateClone.querySelector<HTMLElement>('[data-behavior="text"]')!;
    const tagHiddenField = templateClone.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]')!;
    tagField.setAttribute('value', value);
    tagText.innerText = text;
    tagHiddenField.value = value;
    tagHiddenField.setAttribute('data-text', text);
    this.autocomplete.control.insertBefore(templateClone, this.template);
  }

  private removeTag(value: string) {
    const tag = this.tags.find(this.findByValue(value));
    tag?.remove();
  }

  private findByValue = (value: string) => {
    return (target: HTMLElement) => {
      return target.getAttribute('value') === value;
    };
  };

  private get firstActivableOption() {
    const selectedOption = this.autocomplete.options.find((o) => this.selectedValues.has(o.getAttribute('value')!));
    return selectedOption || this.autocomplete.visibleOptions[0];
  }

  private get tags() {
    return this.autocomplete.tags;
  }

  private get template() {
    return this.autocomplete.querySelector<HTMLTemplateElement>('[data-behavior="tag-template"]')!;
  }
}
