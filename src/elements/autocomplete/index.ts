import Combobox from '@ambiki/combobox';
import { ImpulseElement, property, registerElement, target, targets } from '@ambiki/impulse';
import { isLooselyFocusable } from 'src/helpers/focus';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import LocalSearch from './local_search';
import MultipleSelect from './multiple_select';
import RemoteSearch from './remote_search';
import SingleSelect from './single_select';

interface BaseOptionEvent {
  target: HTMLElement;
  text: string;
  value: string;
}

export interface AwcAutocompleteCommitEvent extends BaseOptionEvent {}
export interface AwcAutocompleteRemoveEvent extends BaseOptionEvent {}

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

  /**
   * If `true`, the listbox will automatically adjust its height based on its content.
   * This helps avoid scrollbars by fitting the content dynamically.
   */
  @property({ type: Boolean }) autoSize = true;

  /**
   * The number of pixels of extra space to add beyond the content's height
   * when `autoSize` is enabled. Acts as vertical padding.
   */
  @property({ type: Number }) autoSizePadding = 4;

  @target() control: HTMLElement;
  @target() input: HTMLInputElement;
  @target() listbox: HTMLElement;
  @target() optionsContainer: HTMLElement;
  @target() clearButton?: HTMLButtonElement;
  @targets() tagDismissButtons: HTMLButtonElement[];
  @targets() groups: HTMLElement[];

  combobox: Combobox;
  selectVariant: SingleSelect | MultipleSelect;
  private searchVariant: LocalSearch | RemoteSearch;
  private floatingUI: UseFloatingUIType;
  private firstFocus = true;
  private preventOutsideClickEvent = false;

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
      autoSize: this.autoSize ? 'height' : undefined,
      autoSizePadding: this.autoSizePadding,
    });

    useOutsideClick(this, {
      boundaries: [this.control, this.listbox],
      callback: (event, target) => {
        // Since the blur event fires before the click event, we need to consider the case when the input is blurred so
        // that we don't prevent the click event from happening.
        if (this.preventOutsideClickEvent && !isLooselyFocusable(target)) {
          event.preventDefault();
        } else if (this.open) {
          this.hide();
        }

        this.preventOutsideClickEvent = false;
      },
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
    this.firstFocus = true;
    this.preventOutsideClickEvent = false;
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
   * Called when the `src` attribute changes.
   */
  srcChanged(src: string) {
    // Clear the selected value without emitting any events to avoid invalid combinations.
    this.clear();
    this.searchVariant = src ? new RemoteSearch(this) : new LocalSearch(this);
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

    if (this.firstFocus && this.input.value) {
      this.input.select();
    }

    this.firstFocus = false;
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
  async handleInputBlur() {
    this.preventOutsideClickEvent = this.open;
    await this.hide();
    this.firstFocus = true;
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
          const tag = this.removeLastTag();
          if (tag) {
            event.preventDefault();
            const value = tag.getAttribute('value') ?? '';
            const { text } = tag.dataset;
            this.emit<AwcAutocompleteRemoveEvent>('remove', { detail: { target: tag, value, text: text || '' } });
          }
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
    const value = option.getAttribute('value') ?? '';
    const { text } = option.dataset;
    this.emit<AwcAutocompleteCommitEvent>('commit', { detail: { target: option, value, text: text || '' } });
  }

  /**
   * @private
   */
  handleFormReset() {
    this.reset();
    this.hide();
    this.emit('reset');
  }

  /**
   * @private
   */
  handleClear() {
    this.clear();
    this.hide();
    this.emit('clear');
  }

  /**
   * @private
   * Removes the tag when the "X" button is clicked.
   */
  handleTagRemove(event: Event) {
    const tag = (event.target as HTMLElement).closest<HTMLElement>('[data-behavior="tag"]');
    if (!tag) return;

    this.removeTag(tag);
    const value = tag.getAttribute('value') ?? '';
    const { text } = tag.dataset;
    this.emit<AwcAutocompleteRemoveEvent>('remove', { detail: { target: tag, value, text: text || '' } });
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
    this.emit('show');
    this.open = true;
    this.floatingUI.start();
    this.combobox.start();
    this.selectVariant.start();
    this.searchVariant.start();
    this.emit('shown');
  }

  /**
   * Hides the listbox element.
   */
  async hide() {
    if (!this.open) return;
    this.emit('hide');
    this.open = false;
    this.combobox.stop();
    this.selectVariant.stop();
    this.searchVariant.stop();
    this.removeAttribute('no-options');
    this.removeAttribute('error');
    await this.floatingUI.stop();
    this.emit('hidden');
  }

  /**
   * Sets the value of the element. If options are fetched from a remote source, the `text` param is required.
   * @param value - The value of the option.
   * @param text - The text of the option.
   */
  setValue(value: string, text?: string) {
    const option = this.options.find((o) => o.getAttribute('value') === value);
    const textValue = text || option?.getAttribute('data-text') || '';
    this.selectVariant.setValue(value, textValue);
  }

  /**
   * Removes a value from the element.
   * @param value - The value of the option (you do not have to provide the value arg for a single select).
   */
  removeValue(value?: string) {
    if (this.multiple && value) {
      (this.selectVariant as MultipleSelect).removeValue(value);
      return;
    }

    this.selectVariant.clear();
  }

  /**
   * Activates an option by setting the `data-active` attribute.
   * @param option - The option you want to activate.
   * @param scroll - When true, it scrolls the option to view (by default, it is true).
   */
  activate(option: HTMLElement, { scroll = true } = {}) {
    this.combobox.activate(option, { scroll: scroll });
  }

  /**
   * Deactivates the active option by removing the `data-active` attribute.
   */
  deactivate() {
    this.combobox.deactivate();
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

  private removeLastTag(): HTMLElement | undefined {
    const lastTag = this.tags[this.tags.length - 1];
    if (!lastTag) return;
    this.removeTag(lastTag);
    return lastTag;
  }

  private removeTag(tag: HTMLElement) {
    const value = tag.getAttribute('value');
    if (!value) return;
    this.removeValue(value);
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
      return this.tags.map((tag) => tag.getAttribute('value') ?? '');
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
   * Returns the option that has the `data-active` attribute.
   */
  get activeOption() {
    return this.combobox.activeOption;
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
  interface GlobalEventHandlersEventMap {
    'awc-autocomplete:commit': CustomEvent<AwcAutocompleteCommitEvent>;
    'awc-autocomplete:remove': CustomEvent<AwcAutocompleteRemoveEvent>;
  }
}
