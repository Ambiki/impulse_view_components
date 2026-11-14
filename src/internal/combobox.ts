/**
 * The part of a combobox every element built on one shares: an input that keeps focus while the user moves an active
 * option through a list and commits it. See docs/adr/0024-the-combobox-knows-the-active-option-not-the-selection.md.
 *
 * It knows nothing of selection, values, filtering or whether the list is open. The element decides what a commit
 * does, which option is active once the list opens or its options change, and when to `start` and `stop`.
 */
import uniqueId from './unique_id';

export interface ComboboxOptions {
  /** The element the user types in, which keeps focus: an `<input>`, a `<textarea>` or an editable element. */
  input: HTMLElement;
  /** The element that holds the options, each a `role="option"`. */
  list: HTMLElement;
  /** Whether Tab commits the active option, as Enter does. */
  tabCommits?: boolean;
  /** Called when the user commits `option`, with the key press or click that did. */
  onCommit: (option: HTMLElement, event: KeyboardEvent | MouseEvent) => void;
}

const OPTION_SELECTOR = '[role="option"]';
const ACTIVE_OPTION_SELECTOR = `${OPTION_SELECTOR}[data-active]`;

export default class Combobox {
  readonly input: HTMLElement;
  readonly list: HTMLElement;
  private readonly tabCommits: boolean;
  private readonly onCommit: ComboboxOptions['onCommit'];
  private listeners?: AbortController;

  constructor({ input, list, tabCommits = false, onCommit }: ComboboxOptions) {
    this.input = input;
    this.list = list;
    this.tabCommits = tabCommits;
    this.onCommit = onCommit;

    list.id ||= uniqueId();
    list.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
  }

  /**
   * Call it when the list opens: the keyboard and the pointer move the active option and commit it from here on.
   */
  start() {
    if (this.listeners) return;

    // Not impulse's `on`: it matches a selector, and these are the two elements the combobox was given.
    const { signal } = (this.listeners = new AbortController());
    this.input.setAttribute('aria-expanded', 'true');
    this.input.addEventListener('keydown', this.handleKeydown, { signal });
    this.list.addEventListener('mousedown', this.handleMousedown, { signal });
    this.list.addEventListener('mousemove', this.handleMousemove, { signal });
    this.list.addEventListener('click', this.handleClick, { signal });
  }

  /**
   * Call it when the list closes: no option stays active, and the keys go back to the input.
   */
  stop() {
    this.listeners?.abort();
    this.listeners = undefined;
    this.input.setAttribute('aria-expanded', 'false');
    this.deactivate();
  }

  /**
   * Makes `option` the active option: it takes `data-active`, and the input points to it with
   * `aria-activedescendant`.
   * @param option - The option to activate.
   * @param options - Activation options.
   * @param options.scroll - Whether to scroll the option into view.
   */
  activate(option: HTMLElement, { scroll = false } = {}) {
    for (const active of this.activeOptions) {
      if (active !== option) {
        active.removeAttribute('data-active');
      }
    }

    option.id ||= uniqueId();
    option.setAttribute('data-active', '');
    this.input.setAttribute('aria-activedescendant', option.id);
    if (scroll) {
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Leaves no option active.
   */
  deactivate() {
    this.input.removeAttribute('aria-activedescendant');
    for (const active of this.activeOptions) {
      active.removeAttribute('data-active');
    }
  }

  /** Every option in the list. */
  get options() {
    return [...this.list.querySelectorAll<HTMLElement>(OPTION_SELECTOR)];
  }

  /** The active option, if there is one. */
  get activeOption() {
    return this.list.querySelector<HTMLElement>(ACTIVE_OPTION_SELECTOR);
  }

  private get activeOptions() {
    return this.list.querySelectorAll<HTMLElement>(ACTIVE_OPTION_SELECTOR);
  }

  private handleKeydown = (event: KeyboardEvent) => {
    // A key held with a modifier is the input's or the element's: Shift+Tab moves focus back, Alt+ArrowDown opens the
    // list.
    if (isComposing(event) || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;

    switch (event.key) {
      case 'ArrowDown':
        consume(event);
        this.move(1);
        break;
      case 'ArrowUp':
        consume(event);
        this.move(-1);
        break;
      case 'Enter': {
        // With no active option, Enter is the input's: it submits the form or breaks the line.
        const option = this.activeOption;
        if (!option) break;
        consume(event);
        if (isEnabled(option)) {
          this.onCommit(option, event);
        }
        break;
      }
      case 'Tab': {
        // Tab is only kept from moving focus when it commits.
        const option = this.activeOption;
        if (!this.tabCommits || !option || !isEnabled(option)) break;
        consume(event);
        this.onCommit(option, event);
        break;
      }
      default:
        // Any other key edits the text or moves its caret, Home and End included, so the user is back in the input.
        this.deactivate();
    }
  };

  private handleMousedown = (event: MouseEvent) => {
    // A press on the list mustn't take focus from the input.
    event.preventDefault();
  };

  // `mousemove`, not `mouseover`: a list that scrolls under a still pointer, as the arrow keys scroll it, sends
  // `mouseover` to the option that lands there, and would take the active option from the keyboard.
  private handleMousemove = (event: MouseEvent) => {
    const option = this.optionOf(event.target);
    if (option && !option.hasAttribute('data-active')) {
      this.activate(option);
    }
  };

  private handleClick = (event: MouseEvent) => {
    const option = this.optionOf(event.target);
    if (option && isEnabled(option)) {
      this.onCommit(option, event);
    }
  };

  /** Moves the active option to the next or previous option the user can see, wrapping at either end. */
  private move(direction: 1 | -1) {
    const options = this.options.filter(isRendered);
    if (options.length === 0) return;

    const active = this.activeOption;
    const index = active ? options.indexOf(active) : -1;
    const first = direction === 1 ? 0 : options.length - 1;
    const next = index === -1 ? first : (index + direction + options.length) % options.length;
    this.activate(options[next], { scroll: true });
  }

  private optionOf(target: EventTarget | null) {
    if (!(target instanceof Element)) return null;
    const option = target.closest<HTMLElement>(OPTION_SELECTOR);
    return option && this.list.contains(option) ? option : null;
  }
}

/** Keeps a key the combobox acted on from the input's default and from handlers further up. */
function consume(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Whether the key belongs to an input method, such as the Enter that accepts its candidate. Safari sends that Enter
 * once the composition has ended, when only its `keyCode` of 229 still says so.
 */
function isComposing(event: KeyboardEvent) {
  return event.isComposing || event.keyCode === 229;
}

/** A disabled option can be active, but can't be committed. */
function isEnabled(option: HTMLElement) {
  return !option.hasAttribute('disabled') && option.getAttribute('aria-disabled') !== 'true';
}

/**
 * Whether the option takes up space on the page. An option is out of reach when it is hidden, and when something
 * around it is: a group with no match, or the whole list while its options load.
 */
function isRendered(option: HTMLElement) {
  return option.offsetWidth > 0 || option.offsetHeight > 0;
}
