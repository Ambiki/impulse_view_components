import type { SelectVariant } from './index';

const HIDDEN_FIELD = 'input[data-behavior="hidden-field"]';

/** A single select's selection. It is kept in one place only: the hidden field the form submits. */
export default class SingleSelect implements SelectVariant {
  /** It has its value, so there is nothing left to choose. */
  readonly closesOnCommit = true;
  private readonly root: HTMLElement;
  /** What `reset` restores: the value and text the element connected with. */
  private defaultValue = '';
  private defaultText = '';

  constructor(root: HTMLElement) {
    this.root = root;
  }

  connected() {
    this.defaultValue = this.value;
    this.defaultText = this.inputText;
  }

  get value() {
    // An element made from code has no hidden field until its markup is added, and no value.
    return this.root.querySelector<HTMLInputElement>(HIDDEN_FIELD)?.value ?? '';
  }

  /** The input shows the selected option's text. */
  get inputText() {
    return this.hiddenField.dataset.text ?? '';
  }

  /** The input holds the selection's text, so it has to be filled whenever the select is required. */
  inputRequired(required: boolean) {
    return required;
  }

  /** The first option that has the value: at most one option is selected. */
  selectedOptions(options: HTMLElement[]) {
    const selected = options.find((option) => option.getAttribute('value') === this.value);
    return selected ? [selected] : [];
  }

  commit(option: HTMLElement) {
    this.setValue(option.getAttribute('value') ?? '', option.dataset.text || '');
  }

  setValue(value: string, text: string) {
    this.hiddenField.value = value;
    this.hiddenField.setAttribute('data-text', text.trim());
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

  reset() {
    this.setValue(this.defaultValue, this.defaultText);
  }

  isSelected(value: string) {
    return this.value === value;
  }

  private get hiddenField() {
    return this.root.querySelector<HTMLInputElement>(HIDDEN_FIELD)!;
  }
}
