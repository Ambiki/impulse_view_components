import type AwcAutocompleteElement from './index';
import type { SelectVariant } from './index';

interface SelectedValue { value: string; text: string }

/**
 * A multiple select's selection. It is kept in one place only: the hidden fields the form submits, one in each tag,
 * so the tags a DOM morph renders are the selection. The options' `aria-selected`, the element's selected class and
 * whether its input is required are brought up to date with them each time the element changes the selection.
 */
export default class MultipleSelect implements SelectVariant {
  readonly autocomplete: AwcAutocompleteElement;
  /** What `reset` restores: the selection the element connected with. */
  private defaultSelection: SelectedValue[] = [];

  constructor(autocomplete: AwcAutocompleteElement) {
    this.autocomplete = autocomplete;
  }

  connected() {
    this.defaultSelection = this.hiddenFields.map((field) => ({ value: field.value, text: field.dataset.text ?? '' }));
    this.autocomplete.listbox.setAttribute('aria-multiselectable', 'true');
  }

  get value() {
    return this.hiddenFields.map((field) => field.value);
  }

  start() {
    this.markSelectedOptions();
    if (this.firstActivableOption) {
      this.autocomplete.combobox.activate(this.firstActivableOption, { scroll: true });
    }
  }

  stop() {
    this.autocomplete.input.value = '';
  }

  reset() {
    this.clear();
    this.defaultSelection.forEach(({ value, text }) => this.setValue(value, text));
  }

  select(option: HTMLElement) {
    const value = option.getAttribute('value');
    const { text } = option.dataset;
    if (!value) return;

    if (this.isSelected(value)) {
      this.removeValue(value);
    } else {
      this.setValue(value, text || '');
    }
  }

  setValue(value: string, text: string) {
    if (this.isSelected(value)) return;
    this.insertTag(value, text.trim());
    this.syncWithSelection();
  }

  clear() {
    this.value.forEach((value) => this.removeValue(value));
  }

  removeValue(value: string) {
    const hiddenField = this.hiddenFields.find((field) => field.value === value);
    if (!hiddenField) return;
    hiddenField.closest('[data-behavior="tag"]')!.remove();
    this.syncWithSelection();
  }

  isSelected(value: string) {
    return this.value.includes(value);
  }

  // eslint-disable-next-line accessor-pairs
  set required(value: boolean) {
    this.autocomplete.input.required = value && this.value.length === 0;
  }

  /** Brings what follows from the selection up to date with it. */
  private syncWithSelection() {
    this.autocomplete.toggleSelectedClass(this.value.length > 0);
    this.required = this.autocomplete.required;
    // The options only say what is selected while the listbox is open: `start` marks them on opening.
    if (this.autocomplete.open) {
      this.markSelectedOptions();
    }
  }

  private markSelectedOptions() {
    const selected = new Set(this.selectedOptions);
    for (const option of this.autocomplete.options) {
      this.autocomplete.markSelected(option, selected.has(option));
    }
  }

  /** The options whose value is selected. An option without a value is never one, as it can't be committed. */
  private get selectedOptions() {
    const values = new Set(this.value);
    return this.autocomplete.options.filter((option) => {
      const value = option.getAttribute('value');
      return !!value && values.has(value);
    });
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
    // The template's button has no `disabled`, and `disabledChanged` only runs when `disabled` changes, so a tag
    // inserted while the select is disabled would get an enabled button.
    for (const button of this.autocomplete.tagDismissButtons) {
      button.disabled = this.autocomplete.disabled;
    }
  }

  private get firstActivableOption() {
    return this.selectedOptions[0] || this.autocomplete.visibleOptions[0];
  }

  /** Each tag's hidden field, in the order of the tags. The field outside the tags, which submits no value, isn't one. */
  private get hiddenFields() {
    return [
      ...this.autocomplete.querySelectorAll<HTMLInputElement>(
        '[data-behavior="tag"] input[data-behavior="hidden-field"]',
      ),
    ];
  }

  private get template() {
    return this.autocomplete.querySelector<HTMLTemplateElement>('[data-behavior="tag-template"]')!;
  }
}
