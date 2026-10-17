import type AwcAutocompleteElement from './index';
import type { SelectVariant } from './index';

interface TDefaultSelectedValue { value: string; text: string }

export default class MultipleSelect implements SelectVariant {
  readonly autocomplete: AwcAutocompleteElement;
  private selectedValues = new Set<string>();
  private defaultSelectedValues: Array<TDefaultSelectedValue> = [];

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    this.autocomplete.listbox.setAttribute('aria-multiselectable', 'true');
    this.defaultSelectedValues = this.tags.reduce<Array<TDefaultSelectedValue>>((array, tag) => {
      const hiddenField = tag.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]')!;
      const value = hiddenField.value;
      this.selectedValues.add(value);
      array.push({ value, text: hiddenField.getAttribute('data-text') || '' });
      return array;
    }, []);
    this.autocomplete.markSelectedOptions();
  }

  start() {
    this.autocomplete.markSelectedOptions();
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
    this.toggleSelectedClass();
    this.required = this.autocomplete.required;
    this.markOption(value);
  }

  clear() {
    this.selectedValues.forEach((value) => this.removeValue(value));
  }

  removeValue(value: string) {
    if (!this.selectedValues.has(value)) return;
    this.selectedValues.delete(value);
    this.removeTag(value);
    this.toggleSelectedClass();
    this.required = this.autocomplete.required;
    this.markOption(value);
  }

  isSelected(value: string) {
    return this.selectedValues.has(value);
  }

  // eslint-disable-next-line accessor-pairs
  set required(value: boolean) {
    if (!value || (value && this.selectedValues.size > 0)) {
      this.autocomplete.input.required = false;
      return;
    }

    this.autocomplete.input.required = true;
  }

  /** Marks the option holding `value` with `aria-selected`, from the selection. */
  private markOption(value: string) {
    const option = this.autocomplete.options.find(this.findByValue(value));
    option?.setAttribute('aria-selected', String(this.isSelected(value)));
  }

  private insertTag(value: string, text: string): void {
    const templateClone = this.template.content.cloneNode(true) as HTMLElement;
    const tagField = templateClone.querySelector<HTMLElement>('[data-behavior="tag"]')!;
    const tagText = templateClone.querySelector<HTMLElement>('[data-behavior="text"]')!;
    const tagHiddenField = templateClone.querySelector<HTMLInputElement>('[data-behavior="hidden-field"]')!;
    tagField.setAttribute('value', value);
    tagField.setAttribute('data-text', text);
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content
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

  private toggleSelectedClass() {
    this.autocomplete.toggleSelectedClass(!!this.selectedValues.size);
  }

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
