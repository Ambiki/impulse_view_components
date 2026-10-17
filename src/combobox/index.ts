import { cycle } from 'src/helpers/array';
import uniqueId from 'src/helpers/unique_id';

const isMac = !!navigator.userAgent.match(/Macintosh/);

/**
 * Pairs a text input with a list of options: the user moves through the options with the arrow keys, Home, End or the
 * pointer, and commits the active one with Enter, Tab or a click. Committing an option emits a bubbling
 * `combobox:commit` event from it.
 *
 * It never decides which options are selected. The element built on it does, in response to `combobox:commit`, and
 * marks them with `aria-selected` (and the list with `aria-multiselectable` when several can be).
 */
export default class Combobox {
  readonly input: HTMLInputElement;
  readonly list: HTMLElement;
  private isMouseMoving = false;

  constructor(input: HTMLInputElement, list: HTMLElement) {
    this.input = input;
    this.list = list;

    if (!this.list.id) this.list.id = uniqueId();

    if (!this.input.getAttribute('aria-expanded')) {
      this.input.setAttribute('aria-expanded', 'false');
    }
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('aria-haspopup', 'listbox');
    this.input.setAttribute('aria-autocomplete', 'list');
    this.list.setAttribute('role', 'listbox');

    this.onKeydown = this.onKeydown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onListMouseover = this.onListMouseover.bind(this);
    this.onListMousemove = this.onListMousemove.bind(this);
  }

  /**
   * Starts listening to the input and the list, marks the input as expanded and prepares the options. Call it when the
   * list opens.
   */
  start() {
    this.isMouseMoving = false;
    this.input.setAttribute('aria-expanded', 'true');
    this.input.setAttribute('aria-controls', this.list.id);

    this.input.addEventListener('keydown', this.onKeydown);
    this.list.addEventListener('click', this.onClick);
    this.list.addEventListener('mouseover', this.onListMouseover);
    this.list.addEventListener('mousemove', this.onListMousemove);
    this.initializeOptions();
  }

  /**
   * Stops listening, marks the input as collapsed and deactivates the active option. Call it when the list closes.
   */
  stop() {
    this.isMouseMoving = false;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-controls');

    this.input.removeEventListener('keydown', this.onKeydown);
    this.list.removeEventListener('click', this.onClick);
    this.list.removeEventListener('mouseover', this.onListMouseover);
    this.list.removeEventListener('mousemove', this.onListMousemove);
    this.deactivate();
  }

  private onKeydown(event: KeyboardEvent) {
    this.isMouseMoving = false;
    if (event.shiftKey || event.metaKey || event.altKey) return;
    if (!isMac && event.ctrlKey) return;

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        if (!this.activeOption) break;
        if (!enabled(this.activeOption)) break;
        event.preventDefault();
        event.stopPropagation();
        this.activeOption.click();
        break;
      case 'Escape':
        this.deactivate();
        break;
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        if (this.activeOption) {
          this.move(1);
        } else {
          this.activate(this.visibleOptions[0], { scroll: true });
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        if (this.activeOption) {
          this.move(-1);
        } else {
          this.activate(this.visibleOptions[this.visibleOptions.length - 1], { scroll: true });
        }
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.activate(this.visibleOptions[0], { scroll: true });
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.activate(this.visibleOptions[this.visibleOptions.length - 1], { scroll: true });
        break;
      default:
        if (event.ctrlKey) break;
        this.deactivate();
    }
  }

  private onClick(event: Event) {
    const option = closestOption(event.target);
    if (!option || !enabled(option)) return;

    option.dispatchEvent(new CustomEvent('combobox:commit', { bubbles: true }));
  }

  private onListMouseover(event: Event) {
    if (!this.isMouseMoving) {
      event.preventDefault();
      return;
    }

    const option = closestOption(event.target);
    if (!option) return;
    this.activate(option);
  }

  private onListMousemove(event: Event) {
    if (this.isMouseMoving) return;

    this.isMouseMoving = true;
    const option = closestOption(event.target);
    if (!option) return;
    this.activate(option);
  }

  /**
   * Makes `option` the active option: sets `data-active` on it, removes it from the others, and points the input's
   * `aria-activedescendant` at it.
   * @param option - The option to activate.
   * @param options - Activation options.
   * @param options.scroll - Whether to scroll the option into view (`false` by default).
   */
  activate(option: HTMLElement, { scroll = false } = {}) {
    for (const el of this.options) {
      if (el.id === option.id) {
        el.setAttribute('data-active', '');
        this.input.setAttribute('aria-activedescendant', el.id);
        if (scroll) el.scrollIntoView({ block: 'nearest' });
      } else {
        el.removeAttribute('data-active');
      }
    }
  }

  /**
   * Leaves no option active: removes `data-active` from the options and `aria-activedescendant` from the input.
   */
  deactivate() {
    this.input.removeAttribute('aria-activedescendant');
    for (const option of Array.from(this.list.querySelectorAll<HTMLElement>('[role="option"][data-active]'))) {
      option.removeAttribute('data-active');
    }
  }

  /** Every option in the list. */
  get options() {
    return Array.from(this.list.querySelectorAll<HTMLElement>('[role="option"]'));
  }

  /** The options that are rendered, which are the ones the keyboard moves through. */
  get visibleOptions() {
    return this.options.filter(visible);
  }

  /** The option that has `data-active`, if any. */
  get activeOption() {
    return this.list.querySelector<HTMLElement>('[data-active]');
  }

  private move(direction: 1 | -1) {
    if (!this.activeOption) return;
    const option = cycle(this.visibleOptions, this.activeOption, direction);
    this.activate(option, { scroll: true });
  }

  /**
   * Takes the options out of the tab order and gives each one an `id` for `aria-activedescendant`. `start()` calls it;
   * call it again after replacing the options while the list is open.
   */
  initializeOptions() {
    for (const option of this.options) {
      option.setAttribute('tabindex', '-1');
      if (!option.id) option.id = uniqueId();
    }
  }
}

function closestOption(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>('[role="option"]');
}

function enabled(option: HTMLElement) {
  return !option.hasAttribute('disabled') && option.getAttribute('aria-disabled') !== 'true';
}

function visible(option: HTMLElement) {
  return (
    !option.hidden &&
    !(option instanceof HTMLInputElement && option.type === 'hidden') &&
    (option.offsetWidth > 0 || option.offsetHeight > 0)
  );
}
