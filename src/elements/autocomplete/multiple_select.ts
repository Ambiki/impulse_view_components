import type { SelectVariant } from './index';

interface SelectedValue { value: string; text: string }

/**
 * A multiple select's selection. It is kept in one place only: the hidden fields the form submits, one in each tag,
 * so the tags a DOM morph renders are the selection.
 */
export default class MultipleSelect implements SelectVariant {
  /** The user goes on selecting, so the listbox stays open. */
  readonly closesOnCommit = false;
  /** The tags show the selection, so the input only holds what the user is typing. */
  readonly inputText = undefined;
  private readonly root: HTMLElement;
  /** What `reset` restores: the selection the element connected with. */
  private defaultSelection: SelectedValue[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
  }

  connected() {
    this.defaultSelection = this.hiddenFields.map((field) => ({ value: field.value, text: field.dataset.text ?? '' }));
  }

  get value() {
    return this.hiddenFields.map((field) => field.value);
  }

  /** The values are in the tags, so the input only has to be filled while there is none. */
  requiresInput(required: boolean) {
    return required && this.value.length === 0;
  }

  /** An option without a value is never selected, as it can't be committed. */
  selectedOptions(options: HTMLElement[]) {
    const values = new Set(this.value);
    return options.filter((option) => {
      const value = option.getAttribute('value');
      return !!value && values.has(value);
    });
  }

  commit(option: HTMLElement) {
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
  }

  clear() {
    this.value.forEach((value) => this.removeValue(value));
  }

  removeValue(value: string) {
    const hiddenField = this.hiddenFields.find((field) => field.value === value);
    hiddenField?.closest('[data-behavior="tag"]')!.remove();
  }

  reset() {
    this.clear();
    this.defaultSelection.forEach(({ value, text }) => this.setValue(value, text));
  }

  isSelected(value: string) {
    return this.value.includes(value);
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
    this.template.before(templateClone);
  }

  /**
   * Each tag's hidden field, in the order of the tags. The field outside the tags, which submits no value, isn't one.
   */
  private get hiddenFields() {
    return [
      ...this.root.querySelectorAll<HTMLInputElement>('[data-behavior="tag"] input[data-behavior="hidden-field"]'),
    ];
  }

  private get template() {
    return this.root.querySelector<HTMLTemplateElement>('[data-behavior="tag-template"]')!;
  }
}
