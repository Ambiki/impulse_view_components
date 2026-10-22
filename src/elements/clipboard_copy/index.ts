import { ImpulseElement, on, property, registerElement } from '@ambiki/impulse';

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
   * The text to copy. When empty, the text of the copy source that `for` names is copied instead.
   */
  @property() value = '';

  /**
   * The `id` of the copy source, whose text is copied when `value` is empty.
   */
  @property() for = '';

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

  private listeners?: AbortController;

  private feedbackTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this.internals.role = 'button';
  }

  connected() {
    // `disabledChanged` only hears changes made once the element has initialized, so one made before that, or while it
    // was removed, is caught up with here. The component renders the `tabindex` that matches, which this leaves alone.
    if (this.disabled === this.hasAttribute('tabindex')) this.syncTabIndex();
    this.internals.ariaDisabled = this.disabled ? 'true' : null;

    this.listeners = new AbortController();
    // Delegated from the document in the capture phase, so the element hears an event before its own listeners and
    // its ancestors' do: a disabled element stops the click before they hear it, and a listener that stops a key's
    // propagation can't keep it from pressing the element. The cost is that `preventDefault()` on Enter or Space
    // there comes too late to cancel the press. `blur`, which doesn't bubble, only reaches the document in that phase.
    const options = { capture: true, signal: this.listeners.signal };
    on('click', this.localName, this.handleClick, options);
    on('keydown', this.localName, this.handleKeydown, options);
    on('keyup', this.localName, this.handleKeyup, options);
    on('blur', this.localName, this.handleBlur, options);
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
  }

  // Every clipboard copy on the page is told of an event on any of them, so each one checks it is the one pressed. A
  // click counts on the element or its content, the other events only on the element itself.
  private handleClick = (event: MouseEvent) => {
    if (event.currentTarget !== this) return;

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
    if (!this.isTargetOf(event) || this.disabled) return;

    if (event.key === 'Enter') {
      this.click();
    } else if (event.key === ' ') {
      // Space would scroll the page.
      event.preventDefault();
      this.spacePressed = true;
    }
  };

  private handleKeyup = (event: KeyboardEvent) => {
    if (!this.isTargetOf(event) || event.key !== ' ' || !this.spacePressed) return;

    this.spacePressed = false;
    this.click();
  };

  private handleBlur = (event: FocusEvent) => {
    if (!this.isTargetOf(event)) return;

    this.spacePressed = false;
  };

  /**
   * Whether the event was dispatched on the element itself. Not `event.target`, which the document sees as the shadow
   * host when the element is in a shadow root.
   */
  private isTargetOf(event: Event) {
    return event.composedPath()[0] === this;
  }

  /**
   * Copies the text as a press does: emits `copied` or `error`, and enters the feedback state. Unlike a press, it copies
   * even when the element is disabled. Resolves once the event has been emitted, and never rejects. Firefox and Safari
   * only let a page write to the clipboard during a user gesture, so call it from one, such as a click handler.
   */
  async copy(): Promise<void> {
    let text: string;
    try {
      text = this.copiedText();
      // Browsers only expose the Clipboard API in a secure context.
      if (!navigator.clipboard) throw new DOMException('The Clipboard API is unavailable.', 'NotSupportedError');
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // An element removed before the write finished has ended its feedback for good.
      if (this.isConnected) this.showFeedback('error');
      this.emit<AwcClipboardCopyErrorEvent>('error', { detail: { error } });
      return;
    }
    if (this.isConnected) this.showFeedback('copied');
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

  /** Its own `value` when it has one, else the text of the copy source its `for` names. */
  private copiedText(): string {
    if (this.value) return this.value;

    const id = this.for;
    // Looked up in the element's own tree, as a label's `for` is. A removed element is in neither.
    const root = this.getRootNode();
    const copySource = id && (root instanceof Document || root instanceof ShadowRoot) ? root.getElementById(id) : null;
    if (!copySource) throw new DOMException(`No copy source has the id "${id}".`, 'NotFoundError');

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
