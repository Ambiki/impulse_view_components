import Combobox from '@ambiki/combobox';
import { ImpulseElement, property, registerElement, target, targets } from '@ambiki/impulse';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import LocalSearch from './local_search';
import MultipleSelect from './multiple_select';
import RemoteSearch from './remote_search';
import SingleSelect from './single_select';

@registerElement('awc-autocomplete')
export default class AwcAutocompleteElement extends ImpulseElement {
  /**
   * Shows/hides the listbox element.
   */
  @property({ type: Boolean }) open = false;

  /**
   * Whether the autocomplete element is disabled or not.
   */
  @property({ type: Boolean }) disabled = false;

  /**
   * Whether the autocomplete element is required or not.
   */
  @property({ type: Boolean }) required = false;

  /**
   * Whether multiple values can be selected or not.
   */
  @property({ type: Boolean }) multiple = false;

  /**
   * The endpoint to fetch the options from.
   */
  @property() src: string;

  /**
   * The param that is appended when making a network request.
   * Example: /users?q=john
   */
  @property() param = 'q';

  @target() control: HTMLElement;
  @target() input: HTMLInputElement;
  @target() listbox: HTMLElement;
  @target() optionsContainer: HTMLElement;
  @target() clearButton?: HTMLButtonElement;
  @targets() tagDismissButtons: HTMLButtonElement[];

  combobox: Combobox;
  selectVariant: SingleSelect | MultipleSelect;
  private searchVariant: LocalSearch | RemoteSearch;
  private floatingUI: UseFloatingUIType;

  constructor() {
    super();
    this.handleFormReset = this.handleFormReset.bind(this);
  }

  /**
   * @private
   * Called when the element is connected to the DOM.
   */
  connected() {
    this.form?.addEventListener('reset', this.handleFormReset);

    this.floatingUI = useFloatingUI(this, {
      referenceElement: this.control,
      popupElement: this.listbox,
      placement: 'bottom',
      sync: 'width',
      offsetOptions: 4,
    });

    this.combobox = new Combobox(this.input, this.listbox, { multiple: this.multiple });
    this.selectVariant = this.multiple ? new MultipleSelect(this) : new SingleSelect(this);
    this.selectVariant.connected();
    this.searchVariant = this.src ? new RemoteSearch(this) : new LocalSearch(this);
    this.selectVariant.required = this.required;
  }

  /**
   * @private
   * Called when the element is disconnected from the DOM.
   */
  disconnected() {
    this.hide();
    this.form?.removeEventListener('reset', this.handleFormReset);
  }

  /**
   * @private
   * Called when the `disabled` attribute changes.
   */
  disabledChanged(value: boolean) {
    this.input.disabled = value;

    if (this.clearButton) {
      this.clearButton.disabled = value;
    }

    for (const button of this.tagDismissButtons) {
      button.disabled = value;
    }
  }

  /**
   * @private
   * Called when the `required` attribute changes.
   */
  requiredChanged(value: boolean) {
    this.selectVariant.required = value;
  }

  /**
   * @private
   */
  handleMousedown(event: Event) {
    // Fix focus jitter issue when clicking outside the input element.
    if (event.target !== this.input) {
      event.preventDefault();
    }
  }

  /**
   * @private
   */
  handleClick(event: Event) {
    if (this.disabled) return;

    this.focus();
    const target = event.target as HTMLElement;
    if (target.hasAttribute('data-trigger')) {
      this.show();
    }
  }

  /**
   * @private
   */
  handleInputMousedown(event: MouseEvent) {
    if (this.disabled) return;
    if (event.buttons === 1) {
      this.show();
    }
  }

  /**
   * @private
   */
  handleInputBlur() {
    this.hide();
  }

  /**
   * @private
   */
  handleInputKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        // Prevent accidental form submissions.
        if (this.open) {
          event.preventDefault();
        }
        break;
      case 'Escape':
        if (this.open) {
          // Prevent dialogs from closing accidentally.
          event.preventDefault();
          event.stopPropagation();
          this.hide();
        }
        break;
      case 'ArrowDown':
        if (event.altKey && !this.open) {
          event.preventDefault();
          this.show();
        }
        break;
      case 'ArrowUp':
        if (event.altKey && this.open) {
          event.preventDefault();
          this.hide();
        }
        break;
      case 'Backspace':
        if (this.multiple && !this.input.value) {
          this.removeLastTag();
        }
        break;
    }
  }

  /**
   * @private
   * Handles the `combobox:commit` event from the combobox.
   */
  handleCommit(event: Event) {
    event.stopPropagation();
    const option = event.target;
    if (!(option instanceof HTMLElement)) return;
    this.selectVariant.select(option);
  }

  /**
   * @private
   */
  handleFormReset() {
    this.reset();
    this.hide();
  }

  /**
   * @private
   * Removes the tag when the "X" button is clicked.
   */
  handleTagRemove(event: Event) {
    const tag = (event.target as HTMLElement).closest<HTMLElement>('[data-behavior="tag"]');
    if (!tag) return;
    this.removeTag(tag);
  }

  /**
   * @private
   */
  handleClear() {
    this.clear();
    this.hide();
  }

  /**
   * @private
   */
  handleInput(event: Event) {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) return;
    const query = target.value.trim();

    this.show();
    this.searchVariant.search(query);
  }

  /**
   * Shows the listbox element.
   */
  show() {
    if (this.open) return;
    this.open = true;
    this.floatingUI.start();
    this.combobox.start();
    this.selectVariant.start();
    this.searchVariant.start();
  }

  /**
   * Hides the listbox element.
   */
  hide() {
    if (!this.open) return;
    this.open = false;
    this.combobox.stop();
    this.selectVariant.stop();
    this.searchVariant.stop();
    this.removeAttribute('no-options');
    this.removeAttribute('error');
    this.floatingUI.stop();
  }

  /**
   * Focuses on the input element.
   * @param options - See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#parameters
   */
  focus(options?: FocusOptions) {
    this.input.focus(options);
  }

  /**
   * Blurs the input element.
   */
  blur() {
    this.input.blur();
  }

  /**
   * Resets the value to the default value.
   */
  reset() {
    this.selectVariant.reset();
  }

  /**
   * Clears the selected value.
   */
  clear() {
    this.selectVariant.clear();
  }

  /**
   * Updates the listbox position.
   */
  async reposition() {
    await this.floatingUI.update();
  }

  private removeLastTag() {
    const lastTag = this.tags[this.tags.length - 1];
    if (!lastTag) return;
    this.removeTag(lastTag);
  }

  private removeTag(tag: HTMLElement) {
    const value = tag.getAttribute('value');
    if (!value) return;
    (this.selectVariant as MultipleSelect).removeValue(value);
  }

  /**
   * @private
   */
  checkIfListIsEmpty() {
    this.toggleAttribute('no-options', this.visibleOptions.length === 0);
  }

  /**
   * @private
   */
  toggleSelectedClass(value: boolean) {
    this.classList.toggle('awc-autocomplete--selected', value);
  }

  /**
   * Returns the selected value.
   */
  get value(): string | string[] {
    if (this.multiple) {
      return [];
    }
    return this.querySelector<HTMLInputElement>('input[data-behavior="hidden-field"]')?.value ?? '';
  }

  /**
   * Returns all the options.
   */
  get options() {
    return this.combobox.options;
  }

  /**
   * Returns all the visible options.
   */
  get visibleOptions() {
    return this.options.filter((option) => !option.hidden);
  }

  /**
   * Returns the parent form element.
   */
  get form() {
    return this.closest('form');
  }

  /**
   * @private
   */
  get tags() {
    return [...this.querySelectorAll<HTMLElement>('[data-behavior="tag"]')];
  }
}

declare global {
  interface Window {
    AwcAutocompleteElement: typeof AwcAutocompleteElement;
  }
  interface HTMLElementTagNameMap {
    'awc-autocomplete': AwcAutocompleteElement;
  }
}
