import { ImpulseElement, property, registerElement } from '@ambiki/impulse';

/** The detail of `awc-clipboard-copy:copied`, emitted once the clipboard holds the copied text. */
export interface AwcClipboardCopyCopiedEvent {
  /** The copied text. */
  text: string;
}

/** The detail of `awc-clipboard-copy:error`, emitted when nothing was copied. */
export interface AwcClipboardCopyErrorEvent {
  /**
   * Why nothing was copied: a `NotFoundError` `DOMException` when there is nothing to copy, a `NotSupportedError` when
   * the page has no Clipboard API, or whatever the browser rejected the write with, usually a `NotAllowedError`.
   */
  error: unknown;
}

@registerElement('awc-clipboard-copy')
export default class AwcClipboardCopyElement extends ImpulseElement {
  /**
   * Whether the element ignores presses. A disabled element takes no focus and is announced as disabled.
   */
  @property({ type: Boolean }) disabled = false;

  /**
   * How long, in milliseconds, the element stays in its feedback state after a press: `:state(copied)` once the text
   * is copied, `:state(error)` when nothing was.
   */
  @property({ type: Number }) feedbackDuration = 2000;

  // The element is the button. Its role and disabled state are default semantics rather than attributes, so a page
  // morph, which syncs attributes to the server's HTML, can't strip them.
  private readonly internals = this.attachInternals();

  /** Whether Space went down on the element since it last had focus, so that releasing it presses the element. */
  private spacePressed = false;

  /** The `disabled` the element's `tabindex` was last in step with, from the time it first connects. */
  private tabIndexDisabled?: boolean;

  private listeners?: AbortController;

  private feedbackTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this.internals.role = 'button';
  }

  connected() {
    // The component renders the `tabindex` that matches the `disabled` it renders with, and `disabledChanged` hears
    // only the changes made while the element is connected. One made while it was removed is caught up with here.
    if (this.tabIndexDisabled !== undefined && this.tabIndexDisabled !== this.disabled) this.syncTabIndex();
    this.tabIndexDisabled = this.disabled;
    this.internals.ariaDisabled = this.disabled ? 'true' : null;

    this.listeners = new AbortController();
    const { signal } = this.listeners;
    // In the capture phase, so that a disabled element can stop the click before anything else on the page hears it.
    this.addEventListener('click', this.handleClick, { capture: true, signal });
    this.addEventListener('keydown', this.handleKeydown, { signal });
    this.addEventListener('keyup', this.handleKeyup, { signal });
    this.addEventListener('blur', this.handleBlur, { signal });
  }

  disconnected() {
    this.listeners?.abort();
    this.spacePressed = false;
    this.showFeedback(null);
  }

  disabledChanged(disabled: boolean) {
    this.internals.ariaDisabled = disabled ? 'true' : null;
    this.syncTabIndex();
    if (disabled) this.spacePressed = false;
  }

  /** A disabled element takes no focus, as a native disabled button doesn't, and loses it if it has it. */
  private syncTabIndex() {
    if (this.disabled) {
      this.removeAttribute('tabindex');
    } else {
      this.tabIndex = 0;
    }
    this.tabIndexDisabled = this.disabled;
  }

  private handleClick = (event: MouseEvent) => {
    if (this.disabled) {
      // A native disabled button gets no click at all.
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    void this.copy();
  };

  // The keys press the element the way they press a native button: Enter as it goes down, Space as it comes up, so
  // that moving focus away first cancels it. Either one clicks the element, as a native button does.
  private handleKeydown = (event: KeyboardEvent) => {
    if (event.target !== this || event.defaultPrevented || this.disabled) return;

    if (event.key === 'Enter') {
      this.click();
    } else if (event.key === ' ') {
      // Space would scroll the page.
      event.preventDefault();
      this.spacePressed = true;
    }
  };

  private handleKeyup = (event: KeyboardEvent) => {
    if (event.target !== this || event.key !== ' ' || !this.spacePressed) return;

    this.spacePressed = false;
    this.click();
  };

  private handleBlur = () => {
    this.spacePressed = false;
  };

  private async copy() {
    let text: string;
    try {
      text = this.copiedText();
      // Browsers only expose the Clipboard API in a secure context.
      if (!navigator.clipboard) throw new DOMException('The Clipboard API is unavailable.', 'NotSupportedError');
      await navigator.clipboard.writeText(text);
    } catch (error) {
      this.showFeedback('error');
      this.emit<AwcClipboardCopyErrorEvent>('error', { detail: { error } });
      return;
    }
    this.showFeedback('copied');
    this.emit<AwcClipboardCopyCopiedEvent>('copied', { detail: { text } });
  }

  /**
   * Puts the element in the feedback state `state`, out of the other one, for `feedbackDuration`, or out of both when
   * `state` is `null`. It is a custom state rather than an attribute, so that a page morph doesn't end it early.
   */
  private showFeedback(state: 'copied' | 'error' | null) {
    clearTimeout(this.feedbackTimeout);
    try {
      this.internals.states.delete('copied');
      this.internals.states.delete('error');
      if (!state) return;

      this.internals.states.add(state);
      this.feedbackTimeout = setTimeout(() => this.showFeedback(null), this.feedbackDuration);
    } catch {
      // Browsers without `:state()` (before Chrome 125, Firefox 126, Safari 17.4) only miss the feedback: the copy and
      // its events still happen.
    }
  }

  /** Its own `value` when it has one, even empty, else the text of the copy source its `for` names. */
  private copiedText(): string {
    const value = this.getAttribute('value');
    if (value !== null) return value;

    const id = this.getAttribute('for');
    // Looked up in the element's own tree, as a label's `for` is.
    const copySource = id ? (this.getRootNode() as Document | ShadowRoot).getElementById(id) : null;
    if (!copySource) throw new DOMException(`No copy source has the id "${id ?? ''}".`, 'NotFoundError');

    if (
      copySource instanceof HTMLInputElement ||
      copySource instanceof HTMLTextAreaElement ||
      copySource instanceof HTMLSelectElement
    ) {
      return copySource.value;
    }
    // The text as rendered: hidden descendants left out, line breaks between blocks kept.
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content
    return copySource.innerText;
  }
}

export { AwcClipboardCopyElement };

declare global {
  interface Window {
    AwcClipboardCopyElement: typeof AwcClipboardCopyElement;
  }
  interface HTMLElementTagNameMap {
    'awc-clipboard-copy': AwcClipboardCopyElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-clipboard-copy:copied': CustomEvent<AwcClipboardCopyCopiedEvent>;
    'awc-clipboard-copy:error': CustomEvent<AwcClipboardCopyErrorEvent>;
  }
}
