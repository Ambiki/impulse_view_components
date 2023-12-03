import Combobox from '@ambiki/combobox';
import { ImpulseElement, property, registerElement, target, targets } from '@ambiki/impulse';
import debounce from 'src/helpers/debounce';
import { isLooselyFocusable } from 'src/helpers/focus';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { getText, getValue } from './helpers';
import MultipleSelect from './multiple_select';
import SingleSelect from './single_select';

@registerElement('awc-autocomplete')
export default class AwcAutocompleteElement extends ImpulseElement {
  /**
   * Shows/hides the listbox element.
   */
  @property({ type: Boolean }) open = false;

  /**
   * The current value of the autocomplete element.
   */
  @property() value: string;

  /**
   * Disables the autocomplete element.
   */
  @property({ type: Boolean }) disabled = false;

  /**
   * Makes the autocomplete element a required field.
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

  @target() input: HTMLInputElement;
  @target() listbox: HTMLElement;
  @target() control: HTMLElement;
  @target() optionsContainer: HTMLElement;
  @target() clearBtn?: HTMLButtonElement;
  @targets() tagDismissBtns?: HTMLButtonElement[];
  @targets() groups: HTMLElement[];

  combobox: Combobox;
  private singleSelect = new SingleSelect(this);
  private multipleSelect = new MultipleSelect(this);
  private selectVariant?: SingleSelect | MultipleSelect;
  private floatingUI: UseFloatingUIType;
  private firstFocus = true;
  private abortController?: AbortController;
  private currentQuery?: string;
  private inputPristine = false;

  constructor() {
    super();
    this.remoteSearch = debounce(this.remoteSearch.bind(this), 300);
    this.handleFormReset = this.handleFormReset.bind(this);
  }

  /**
   * Called when the element is connected to the DOM.
   */
  connected() {
    this.floatingUI = useFloatingUI(this, {
      referenceElement: this.control,
      popupElement: this.listbox,
      placement: 'bottom',
      sync: 'width',
      offsetOptions: 4,
    });
    useOutsideClick(this, {
      boundaries: [this.control, this.listbox],
      callback: (event: Event, target: HTMLElement) => {
        // Since the blur event fires before the click event, we need to conditionally prevent the event so that the
        // dialog element remains open when there are nested autocomplete elements inside it which are still open.
        if (this.inputPristine && !isLooselyFocusable(target)) {
          event.preventDefault();
        } else if (this.open) {
          this.open = false;
        }

        this.inputPristine = false;
      },
    });
    this.combobox = new Combobox(this.input, this.listbox, { multiple: this.multiple });
    this.selectVariant = this.multiple ? this.multipleSelect : this.singleSelect;
    this.selectVariant.connected();
    this.form?.addEventListener('reset', this.handleFormReset);
    this.selectVariant.setRequiredAttribute(this.required);
  }

  /**
   * Called when the element is removed from the DOM.
   */
  disconnected() {
    this.open = false;
    this.removeAttribute('data-focus');
    this.firstFocus = true;
    this.selectVariant?.disconnected();
    this.abortController = undefined;
    this.form?.removeEventListener('reset', this.handleFormReset);
  }

  /**
   * Called when the `open` attribute changes.
   */
  async openChanged(newValue: boolean) {
    if (newValue) {
      this.emit('show');
      this.combobox.start();
      this.listbox.hidden = false;
      this.floatingUI.start();
      if (this.src) {
        await this.makeRequest('');
      } else {
        this.checkIfListIsEmpty();
      }
      this.selectVariant?.start();
      if (this.selectVariant?.firstActiveOption) {
        this.activate(this.selectVariant.firstActiveOption);
      }
      this.emit('shown');
    } else {
      this.emit('hide');
      this.listbox.hidden = true;
      this.abortController?.abort();
      this.selectVariant?.stop();
      this.combobox.stop();
      if (!this.src) {
        for (const option of this.options) {
          option.hidden = false;
        }
        for (const group of this.groups) {
          group.hidden = false;
        }
      }
      this.removeAttribute('no-options');
      this.removeAttribute('error');
      this.inputPristine = false;
      this.currentQuery = undefined;
      await this.floatingUI.stop();
      this.emit('hidden');
    }
  }

  /**
   * Called when the `value` attribute changes.
   */
  valueChanged(newValue: string) {
    this.classList.toggle('awc-autocomplete--selected', newValue !== '' && newValue !== '[]');
  }

  /**
   * Called when the `disabled` attribute changes.
   */
  disabledChanged(newValue: boolean) {
    this.input.disabled = newValue;

    if (this.clearBtn) {
      this.clearBtn.disabled = newValue;
    }

    if (this.multiple && this.tagDismissBtns) {
      for (const btn of this.tagDismissBtns) {
        btn.disabled = newValue;
      }
    }
  }

  /**
   * Called when the `required` attribute changes.
   */
  requiredChanged(newValue: boolean) {
    this.selectVariant?.setRequiredAttribute(newValue);
  }

  handleMousedown(event: Event) {
    if (event.target !== this.input) {
      event.preventDefault();
    }
  }

  handleClick(event: Event) {
    if (this.disabled) return;
    this.input.focus();
    const target = event.target as HTMLElement;
    const { classList } = target;
    // By default, the listbox only opens when clicking on the input field. In certain cases, the surface area of the
    // click region becomes small, and that is why we open the listbox when clicking on additional elements also.
    if (classList.contains('awc-autocomplete-control') || classList.contains('awc-autocomplete-end-adornment')) {
      this.open = true;
    }

    if (this.firstFocus && this.input.value) {
      this.input.select();
    }

    this.firstFocus = false;
  }

  handleInputMousedown(event: Event) {
    // Prevent to always open the listbox.
    event.preventDefault();
    this.open = true;
  }

  handleInputFocus() {
    this.setAttribute('data-focus', '');
  }

  handleInputBlur() {
    if (this.open) {
      this.open = false;
      this.inputPristine = true;
    }
    this.removeAttribute('data-focus');
    this.firstFocus = true;
  }

  handleInputKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        if (this.open) {
          // Prevent accidental form submissions.
          event.preventDefault();
        }
        break;
      case 'Escape':
        if (this.open) {
          event.preventDefault();
          // Prevent modals from closing accidentally.
          event.stopPropagation();
          this.open = false;
        }
        break;
      case 'ArrowDown':
        if (event.altKey && !this.open) {
          event.preventDefault();
          this.open = true;
        }
        break;
      case 'ArrowUp':
        if (event.altKey && this.open) {
          event.preventDefault();
          this.open = false;
        }
        break;
      case 'Backspace':
        if (this.input.value === '' && this.multiple) {
          const { tags } = this.multipleSelect;
          const lastTag = tags[tags.length - 1];
          if (lastTag) {
            event.preventDefault();
            this.multipleSelect.removeValue(getValue(lastTag));
            this.emit('remove', { detail: { target: lastTag } });
          }
        }
        break;
    }
  }

  async handleInput(event: Event) {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) return;

    const query = target.value.trim();
    if (this.src) {
      await this.remoteSearch(query);
    } else {
      this.search(query);
    }
  }

  async handleCommit(event: Event) {
    event.stopPropagation();
    const option = event.target;
    if (!(option instanceof HTMLElement)) return;

    await this.selectVariant?.commit(option);
    this.emit('commit', { detail: { target: option } });
  }

  handleClear() {
    this.open = false;
    this.clear();
    this.emit('clear');
  }

  handleTagRemove(event: Event) {
    const tag = (event.target as HTMLElement).closest<HTMLElement>('[data-behavior="tag"]');
    if (!tag) return;
    this.multipleSelect.removeValue(getValue(tag));
    this.emit('remove', { detail: { target: tag } });
  }

  handleFormReset() {
    this.open = false;
    this.reset();
    this.emit('reset');
  }

  /**
   * Sets the value of the element.
   * @param value - The value of the option.
   * @param text - The text of the option.
   */
  setValue(value: string, text: string) {
    this.selectVariant?.setValue(value, text);
  }

  /**
   * Removes a value from the element.
   * @param value - The value of the option (you do not have to provide the value arg for a single select).
   */
  removeValue(value?: string) {
    if (this.multiple && value) {
      this.multipleSelect.removeValue(value);
      return;
    }

    this.singleSelect.removeValue();
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
   * Deselects all the selected options.
   */
  clear() {
    this.selectVariant?.clear();
    this.currentQuery = undefined;
  }

  /**
   * Resets the autocomplete element to its initial state.
   */
  reset() {
    this.selectVariant?.reset();
    this.currentQuery = undefined;
  }

  /**
   * Sets the focus on the input element.
   * @param options - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#parameters
   */
  focus(options?: FocusOptions) {
    // Do not add the `data-focus` attribute. Behave like a native input element.
    this.input.focus(options);
  }

  /**
   * Removes keyboard focus from the input element.
   */
  blur() {
    this.input.blur();
    this.removeAttribute('data-focus');
  }

  /**
   * Shows the listbox.
   */
  show() {
    if (this.open) return;
    this.open = true;
  }

  /**
   * Hides the listbox.
   */
  hide() {
    if (!this.open) return;
    this.open = false;
  }

  private search(query: string) {
    this.open = true;
    this.options.forEach(filterOptions(query));
    this.checkIfListIsEmpty();
    // Activate the first visible option after filtering the options.
    if (this.visibleOptions[0]) {
      this.activate(this.visibleOptions[0]);
    }
  }

  // This function is debounced.
  private async remoteSearch(query: string) {
    this.open = true;
    await this.makeRequest(query);
    this.selectVariant?.start();
    // Activate the first visible option after making the request.
    if (this.visibleOptions[0]) {
      this.activate(this.visibleOptions[0]);
    }
  }

  async makeRequest(query: string) {
    if (this.currentQuery === query) return;
    this.currentQuery = query;

    if (this.abortController) {
      this.abortController.abort();
    } else {
      this.setAttribute('loading', '');
      this.emit('loadstart', { bubbles: false, prefix: false });
    }

    this.removeAttribute('error');
    this.abortController = new AbortController();
    const url = new URL(this.src, window.location.href);
    const params = new URLSearchParams(url.search.slice(1));
    params.append(this.param, query);
    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        signal: this.abortController.signal,
        credentials: 'same-origin',
        headers: {
          accept: 'text/fragment+html',
        },
      });

      if (response.ok) {
        this.optionsContainer.innerHTML = await response.text();
        this.checkIfListIsEmpty();
        this.combobox.initializeOptions();
        this.abortController = undefined;
        // Update listbox position after adding options from the server.
        await this.floatingUI.update();
        this.emit('load', { bubbles: false, prefix: false });
      } else {
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.abortController = undefined;
        this.setAttribute('error', '');
        this.emit('error', { bubbles: false, prefix: false });
      }
    } finally {
      this.removeAttribute('loading');
      this.emit('loadend', { bubbles: false, prefix: false });
    }
  }

  private checkIfListIsEmpty() {
    this.toggleAttribute('no-options', this.visibleOptions.length === 0);
  }

  /**
   * Returns the option that has the `data-active` attribute.
   */
  get activeOption() {
    return this.combobox.activeOption;
  }

  /**
   * Returns all the visible options of the autocomplete element.
   */
  get visibleOptions() {
    return this.options.filter((o) => !o.hidden);
  }

  /**
   * Returns all the options of the autocomplete element.
   */
  get options() {
    return this.combobox.options;
  }

  /**
   * Returns the parent form element.
   */
  get form() {
    return this.closest('form');
  }
}

function filterOptions(query: string) {
  return (target: HTMLElement) => {
    const group = target.closest<HTMLElement>('[role="group"]');

    if (query) {
      const value = getText(target);
      const match = value?.toLowerCase().includes(query.toLowerCase());
      target.hidden = !match;
      if (group) {
        const options = Array.from(group.querySelectorAll<HTMLElement>('[role="option"]'));
        group.hidden = options.every((o) => o.hidden);
      }
    } else {
      target.hidden = false;
      if (group) {
        group.hidden = false;
      }
    }
  };
}

declare global {
  interface Window {
    AwcAutocompleteElement: typeof AwcAutocompleteElement;
  }
}
