import Combobox from '@ambiki/combobox';
import debounce from 'src/helpers/debounce';
import useFloatingUI, { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import { ImpulseElement, property, registerElement, target, targets } from 'src/impulse';
import { getText, getValue } from './helpers';
import MultipleSelect from './multiple_select';
import SingleSelect from './single_select';

@registerElement('awc-autocomplete')
export default class AwcAutocompleteElement extends ImpulseElement {
  @property({ type: Boolean }) open = false;
  @property() value: string;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) multiple = false;
  @property() src: string;
  @property() param = 'q';

  @target() input: HTMLInputElement;
  @target() listbox: HTMLElement;
  @target() control: HTMLElement;
  @target() optionsContainer: HTMLElement;
  @target() clearBtn: HTMLButtonElement;
  @targets() tagDismissBtns?: HTMLButtonElement[];

  combobox: Combobox;
  private singleSelect = new SingleSelect(this);
  private multipleSelect = new MultipleSelect(this);
  private selectVariant: SingleSelect | MultipleSelect;
  private floatingUI: UseFloatingUIType;
  private firstFocus = true;
  private abortController?: AbortController;
  private currentQuery?: string;

  constructor() {
    super();
    this.remoteSearch = debounce(this.remoteSearch.bind(this), 300);
    this.handleFormReset = this.handleFormReset.bind(this);
  }

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
      callback: () => {
        this.open = false;
      },
    });
    this.combobox = new Combobox(this.input, this.listbox, { multiple: this.multiple });
    this.selectVariant = this.multiple ? this.multipleSelect : this.singleSelect;
    this.selectVariant.connected();
    this.form?.addEventListener('reset', this.handleFormReset);
  }

  disconnected(): void {
    this.open = false;
    this.removeAttribute('data-focus');
    this.firstFocus = true;
    this.selectVariant.disconnected();
    this.abortController = undefined;
    this.form?.removeEventListener('reset', this.handleFormReset);
  }

  async openChanged(newValue: boolean) {
    if (newValue) {
      this.combobox.start();
      this.listbox.hidden = false;
      this.floatingUI.start();
      if (this.src) {
        await this.makeRequest('');
      } else {
        this.checkIfListIsEmpty();
      }
      this.selectVariant.start();
      if (this.selectVariant.firstActiveOption) {
        this.activate(this.selectVariant.firstActiveOption);
      }
    } else {
      this.listbox.hidden = true;
      this.abortController?.abort();
      this.selectVariant.stop();
      this.combobox.stop();
      if (!this.src) {
        for (const option of this.options) {
          option.hidden = false;
        }
      }
      this.removeAttribute('no-options');
      this.removeAttribute('error');
      this.currentQuery = undefined;
      await this.floatingUI.stop();
    }
  }

  valueChanged(newValue: string) {
    this.classList.toggle('awc-autocomplete--selected', newValue !== '' && newValue !== '[]');
  }

  disabledChanged(newValue: boolean) {
    this.input.disabled = newValue;
    this.clearBtn.disabled = newValue;

    if (this.multiple && this.tagDismissBtns) {
      for (const btn of this.tagDismissBtns) {
        btn.disabled = newValue;
      }
    }
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

  handleInputMousedown() {
    this.open = true;
  }

  handleInputFocus() {
    this.setAttribute('data-focus', '');
  }

  handleInputBlur() {
    this.open = false;
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
          // Prevent modals from accidentally closing.
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

    await this.selectVariant.commit(option);
  }

  handleClear() {
    this.clear();
    this.open = false;
  }

  handleTagRemove(event: Event) {
    const tag = (event.target as HTMLElement).closest<HTMLElement>('[data-behavior="tag"]');
    if (!tag) return;
    this.multipleSelect.removeValue(getValue(tag));
  }

  handleFormReset() {
    this.open = false;
    this.reset();
  }

  activate(option: HTMLElement, { scroll = true } = {}) {
    this.combobox.activate(option, { scroll: scroll });
  }

  clear() {
    this.selectVariant.clear();
    this.currentQuery = undefined;
  }

  reset() {
    this.selectVariant.reset();
    this.currentQuery = undefined;
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
    this.selectVariant.start();
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
      } else {
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.abortController = undefined;
        this.setAttribute('error', '');
      }
    } finally {
      this.removeAttribute('loading');
    }
  }

  private checkIfListIsEmpty(): void {
    this.toggleAttribute('no-options', this.visibleOptions.length === 0);
  }

  get visibleOptions() {
    return this.options.filter((o) => !o.hidden);
  }

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
  return (target: HTMLElement): void => {
    if (query) {
      const value = getText(target);
      const match = value?.toLowerCase().includes(query.toLowerCase());
      target.hidden = !match;
    } else {
      target.hidden = false;
    }
  };
}

declare global {
  interface Window {
    AwcAutocompleteElement: typeof AwcAutocompleteElement;
  }
}
