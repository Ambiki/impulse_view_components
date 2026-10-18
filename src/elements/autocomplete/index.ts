import type { UseFloatingUIType } from 'src/hooks/use_floating_ui';
import type { AutocompleteEventArgs, AutocompleteEventMap, AutocompleteEventName } from './events';
import Combobox from '@ambiki/combobox';
import { property, registerElement, target, targets } from '@ambiki/impulse';
import { isLooselyFocusable } from 'src/helpers/focus';
import useFloatingUI from 'src/hooks/use_floating_ui';
import useOutsideClick from 'src/hooks/use_outside_click';
import OpenableElement from 'src/internal/openable_element';
import AjaxSearch from './ajax_search';
import { optionEventDetail } from './events';
import LocalSearch from './local_search';
import MultipleSelect from './multiple_select';
import SingleSelect from './single_select';

export type { AwcAutocompleteCommitEvent, AwcAutocompleteRemoveEvent } from './events';

/** Whether multiple values can be selected. */
export type SelectionMode = 'single' | 'multiple';

/** Where the options come from: the page (`local`) or the server (`ajax`). */
export type Source = 'local' | 'ajax';

/** Resolves the runtime `multiple` property type from the selection mode. */
type IsMultiple<Mode extends SelectionMode> = Mode extends 'multiple' ? true : false;

/** Resolves the runtime `ajax` getter type from the source. */
type IsAjax<Src extends Source> = Src extends 'ajax' ? true : false;

/** Resolves the `value` type based on the selection mode. */
export type AutocompleteValue<Mode extends SelectionMode> = Mode extends 'multiple' ? string[] : string;

/** Resolves the `removeValue` arguments: required for multi-select, none for single-select. */
type RemoveValueArgs<Mode extends SelectionMode> = Mode extends 'multiple' ? [value: string] : [];

/** Resolves the `setValue` text argument: required for an ajax source, optional otherwise. */
type SetValueTextArgs<Src extends Source> = Src extends 'ajax' ? [text: string] : [text?: string];

/**
 * The contract implemented by the single and multiple select variants.
 *
 * Both variants implement every member, so a member added here has to be answered by both of them before the code
 * compiles — which is the point. There is no way for one variant to quietly lack an operation the other has.
 */
export interface SelectVariant {
  connected: () => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
  select: (option: HTMLElement) => void;
  setValue: (value: string, text: string) => void;
  clear: () => void;
  /**
   * Removes `value` from the selection. A single select holds at most one value, so it ignores the argument and
   * clears whatever is selected.
   */
  removeValue: (value: string) => void;
  /** Whether `value` is part of the selection. */
  isSelected: (value: string) => boolean;
  set required(value: boolean);
}

/** The contract implemented by the local and ajax search variants. */
export interface SearchVariant {
  search: (value: string) => void | Promise<void>;
  start: () => void;
  stop: () => void;
  /** Releases anything still outstanding — an in-flight request, a pending debounce — before the variant is dropped. */
  disconnected: () => void;
}

@registerElement('awc-autocomplete')
export default class AwcAutocompleteElement<
  Mode extends SelectionMode = SelectionMode,
  Src extends Source = Source,
> extends OpenableElement {
  /**
   * Whether the listbox is open. Setting it shows or hides the listbox, as `show` and `hide` do.
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
  @property({ type: Boolean }) multiple: IsMultiple<Mode> = false as IsMultiple<Mode>;

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
   * If `true`, caps the listbox's height to the space between it and the edge of the viewport, so a long list scrolls
   * instead of running off screen.
   */
  @property({ type: Boolean }) autoSize = false;

  /**
   * The space in pixels to keep between the listbox and the edge of the viewport when `autoSize` is enabled.
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
  /**
   * @private
   */
  selectVariant: SelectVariant;
  private searchVariant: SearchVariant;
  private floatingUI: UseFloatingUIType;
  private firstFocus = true;
  private preventOutsideClickEvent = false;

  constructor() {
    super();
    this.handleFormReset = this.handleFormReset.bind(this);
  }

  /**
   * Called when the element is connected to the DOM.
   * @private
   */
  connected() {
    this.form?.addEventListener('reset', this.handleFormReset);

    // Read on every reposition, so that `auto-size` and `auto-size-padding` follow their attributes. Their `*Changed`
    // callbacks reposition straight away.
    this.floatingUI = useFloatingUI(this, () => ({
      anchorElement: this.control,
      floatingElement: this.listbox,
      placement: 'bottom',
      sync: 'width',
      offsetOptions: 4,
      autoSize: this.autoSize ? 'height' : undefined,
      autoSizePadding: this.autoSizePadding,
    }));

    useOutsideClick(this, {
      boundaries: [this.control, this.listbox],
      callback: (event, target) => {
        // Since the blur event fires before the click event, we need to consider the case when the input is blurred so
        // that we don't prevent the click event from happening.
        if (this.preventOutsideClickEvent && !isLooselyFocusable(target)) {
          event.preventDefault();
        } else if (this.open) {
          this.requestHide();
        }

        this.preventOutsideClickEvent = false;
      },
    });

    this.combobox = new Combobox(this.input, this.listbox, { multiple: this.multiple });
    this.selectVariant = this.multiple ? new MultipleSelect(this) : new SingleSelect(this);
    this.selectVariant.connected();
    this.searchVariant = this.src ? new AjaxSearch(this) : new LocalSearch(this);
    this.selectVariant.required = this.required;
    super.connected();
  }

  /**
   * Called when the element is disconnected from the DOM.
   * @private
   */
  disconnected() {
    super.disconnected();
    this.searchVariant?.disconnected();
    this.form?.removeEventListener('reset', this.handleFormReset);
    this.firstFocus = true;
    this.preventOutsideClickEvent = false;
  }

  /**
   * Called when the `disabled` attribute changes.
   * @private
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
   * Called when the `required` attribute changes.
   * @private
   */
  requiredChanged(value: boolean) {
    this.selectVariant.required = value;
  }

  /**
   * Called when the `src` attribute changes.
   * @private
   */
  srcChanged(src: string) {
    // Clear the selected value without emitting any events to avoid invalid combinations.
    this.clear();
    // Release the outgoing variant before replacing it, so a request made against the previous source cannot land in
    // the listbox of the new one.
    this.searchVariant?.disconnected();
    this.searchVariant = src ? new AjaxSearch(this) : new LocalSearch(this);
  }

  /**
   * Called when the `auto-size` attribute changes.
   * @private
   */
  autoSizeChanged() {
    this.reposition();
  }

  /**
   * Called when the `auto-size-padding` attribute changes.
   * @private
   */
  autoSizePaddingChanged() {
    this.reposition();
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
      this.requestShow();
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
      this.requestShow();
    }
  }

  /**
   * @private
   */
  async handleInputBlur() {
    this.preventOutsideClickEvent = this.open;
    await this.requestHide();
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
          this.requestHide();
        }
        break;
      case 'ArrowDown':
        if (event.altKey && !this.open) {
          event.preventDefault();
          this.requestShow();
        }
        break;
      case 'ArrowUp':
        if (event.altKey && this.open) {
          event.preventDefault();
          this.requestHide();
        }
        break;
      case 'Backspace':
        if (this.multiple && !this.input.value) {
          const tag = this.removeLastTag();
          if (tag) {
            event.preventDefault();
            this.emitEvent('remove', optionEventDetail(tag));
          }
        }
        break;
    }
  }

  /**
   * Handles the `combobox:commit` event from the combobox.
   * @private
   */
  handleCommit(event: Event) {
    event.stopPropagation();
    const option = event.target;
    if (!(option instanceof HTMLElement)) return;

    this.selectVariant.select(option);
    const detail = optionEventDetail(option);
    this.emitEvent('commit', { ...detail, selected: this.selectVariant.isSelected(detail.value) });
  }

  /**
   * @private
   */
  handleFormReset() {
    this.reset();
    // Direct, not a request: the form may have been reset from code, and the value is already gone.
    this.hide();
    this.emitEvent('reset');
  }

  /**
   * @private
   */
  handleClear() {
    this.clear();
    this.requestHide();
    this.emitEvent('clear');
  }

  /**
   * Removes the tag when the "X" button is clicked.
   * @private
   */
  handleTagRemove(event: Event) {
    const tag = (event.target as HTMLElement).closest<HTMLElement>('[data-behavior="tag"]');
    if (!tag) return;

    this.removeTag(tag);
    this.emitEvent('remove', optionEventDetail(tag));
  }

  /**
   * @private
   */
  handleInput(event: Event) {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) return;
    const query = target.value.trim();

    this.requestShow();
    this.searchVariant.search(query);
  }

  /* eslint-disable jsdoc/check-param-names -- documents the arguments the rest tuples resolve to */
  /**
   * Sets the value of the element. If the options are fetched from the server, the `text` param is required.
   * @param value - The value of the option.
   * @param text - The text of the option.
   */
  setValue(value: string, ...rest: SetValueTextArgs<Src>) {
    const [text] = rest as [string?];
    const option = this.options.find((o) => o.getAttribute('value') === value);
    const textValue = text || option?.getAttribute('data-text') || '';
    this.selectVariant.setValue(value, textValue);
  }

  /**
   * Removes a value from the element.
   * @param value - The value of the option (you do not have to provide the value arg for a single select).
   */
  removeValue(...args: RemoveValueArgs<Mode>) {
    const [value] = args as [string?];
    if (value) {
      this.selectVariant.removeValue(value);
      return;
    }

    this.selectVariant.clear();
  }
  /* eslint-enable jsdoc/check-param-names */

  /**
   * Activates an option by setting the `data-active` attribute.
   * @param option - The option you want to activate.
   * @param options - Activation options.
   * @param options.scroll - When true, it scrolls the option to view (by default, it is true).
   */
  activate(option: HTMLElement, { scroll = true } = {}) {
    this.combobox.activate(option, { scroll });
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

  /**
   * Emits one of the events declared in `./events`. Going through here rather than `emit` is what keeps the set of
   * events the element dispatches and the set it declares to listeners in step: an undeclared name or a detail of the
   * wrong shape does not compile. `OpenableElement` emits the request and state events, which `./events` declares too.
   */
  private emitEvent<Name extends AutocompleteEventName>(name: Name, ...args: AutocompleteEventArgs<Name>) {
    const [detail] = args;
    return this.emit(name, { detail });
  }

  /** Shows the listbox. */
  protected openParts() {
    this.floatingUI.start();
    this.combobox.start();
    this.selectVariant.start();
    this.searchVariant.start();
  }

  /** Hides the listbox. */
  protected async closeParts() {
    this.combobox.stop();
    this.selectVariant.stop();
    this.searchVariant.stop();
    this.removeAttribute('no-options');
    this.removeAttribute('error');
    await this.floatingUI.stop();
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
    // Tags only exist in multi-select mode, so the value argument is always required here.
    (this as AwcAutocompleteElement<'multiple'>).removeValue(value);
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
   * Whether the options are fetched from the server (i.e. the `src` attribute is set).
   * Narrowing on this (`if (el.ajax)`) resolves source-dependent types such as `setValue`.
   */
  get ajax(): IsAjax<Src> {
    return Boolean(this.src) as IsAjax<Src>;
  }

  /**
   * Returns the selected value.
   */
  get value(): AutocompleteValue<Mode> {
    if (this.multiple) {
      return this.tags.map((tag) => tag.getAttribute('value') ?? '') as AutocompleteValue<Mode>;
    }
    return (this.querySelector<HTMLInputElement>('input[data-behavior="hidden-field"]')?.value ??
      '') as AutocompleteValue<Mode>;
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

export type SingleAutocompleteElement<Src extends Source = Source> = AwcAutocompleteElement<'single', Src>;
export type MultipleAutocompleteElement<Src extends Source = Source> = AwcAutocompleteElement<'multiple', Src>;
export type LocalAutocompleteElement<Mode extends SelectionMode = SelectionMode> = AwcAutocompleteElement<
  Mode,
  'local'
>;
export type AjaxAutocompleteElement<Mode extends SelectionMode = SelectionMode> = AwcAutocompleteElement<
  Mode,
  'ajax'
>;

declare global {
  interface Window {
    AwcAutocompleteElement: typeof AwcAutocompleteElement;
  }
  interface HTMLElementTagNameMap {
    // The full cross-product of both dimensions so `if (el.multiple)` and `if (el.ajax)` each narrow.
    'awc-autocomplete':
      SingleAutocompleteElement<'local'> |
      SingleAutocompleteElement<'ajax'> |
      MultipleAutocompleteElement<'local'> |
      MultipleAutocompleteElement<'ajax'>;
  }
  // Derived from the event map so that declaring an event and typing it for listeners are the same act.
  interface GlobalEventHandlersEventMap extends AutocompleteEventMap {}
}
