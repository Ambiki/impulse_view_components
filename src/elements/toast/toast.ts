import type AwcToastRegionElement from './region';
import { property, registerElement, whenInitialized } from '@ambiki/impulse';
import OpenableElement from 'src/internal/openable_element';
import uniqueId from 'src/internal/unique_id';
import { tabbable } from 'tabbable';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * The toasts shown on this page. A toast that connects showing or leaving without being one of them is a copy, from a
 * page restored from cache, and is never shown again. One that moves with its region, into a modal dialog and out, is
 * one of them, and carries on as it was.
 */
const shownToasts = new WeakSet<AwcToastElement>();

/** How long a toast shows for without a `duration` of its own, unless it is a danger toast or holds an action. */
const DEFAULT_DURATION = 5000;

/** On a toast while it comes in, which its stylesheet animates. */
const ENTERING_CLASS = 'awc-toast--entering';

/** On a toast while it fades out, hidden but not yet removed. A cached page's copy of one can hold it too. */
const LEAVING_CLASS = 'awc-toast--leaving';

/** Resolves once `element`'s running animations and transitions have finished, or been cancelled. */
function animationsFinished(element: Element) {
  return Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
}

/** Whether `event` comes from the keyboard: a key, or the click it makes on a button, which has no presses to count. */
function isFromKeyboard(event?: Event) {
  return event instanceof KeyboardEvent || (event instanceof MouseEvent && event.detail === 0);
}

@registerElement('awc-toast')
export default class AwcToastElement extends OpenableElement {
  /**
   * Whether the toast is showing. Setting it shows or hides the toast, as `show` and `hide` do.
   */
  @property({ type: Boolean }) open = false;

  /**
   * What kind of message the toast is. It sets the icon and colours, and how urgently the toast is announced.
   */
  @property() variant: ToastVariant = 'info';

  /**
   * How long, in milliseconds, the toast shows before it hides itself; `Infinity` keeps it until it is dismissed.
   * Without one, a toast hides after 5 seconds, unless it is a danger toast or holds an action, such as a link or a
   * button other than its close button, which stay until dismissed.
   */
  @property({ type: Number }) duration = DEFAULT_DURATION;

  /** What is left of the toast's duration, from when it was last shown or paused. */
  private remaining = 0;

  private timer?: ReturnType<typeof setTimeout>;

  /** When the timer last started. */
  private startedAt = 0;

  /** The region the toast connected in, which it still has to tell once it is removed from it. */
  private connectedRegion: AwcToastRegionElement | null = null;

  connected() {
    const shown = shownToasts.has(this);
    if (!shown && (this.open || this.leaving)) {
      this.remove();
      return;
    }
    // A morph makes an element without an `id` into whatever new element follows, and a showing toast into the new
    // toast, which has no `open` and so would hide as it arrived. With an `id` of its own, a toast is left alone.
    if (!this.id) this.id = uniqueId();
    this.connectedRegion = this.region;
    super.connected();
    // A toast rendered into the region, or added to it, shows as it connects. One already shown that is leaving, and
    // moved with its region, carries on leaving.
    if (!shown) this.show();
  }

  disconnected() {
    super.disconnected();
    // Focus in a removed toast is dropped without a `focusout`, which the region would have paused on.
    const region = this.connectedRegion;
    this.connectedRegion = null;
    if (region) queueMicrotask(() => region.syncFocusPause());
  }

  /**
   * Hides the toast, and removes it from the region: a hidden toast is done with. Emits `hidden` but no `hide`: use
   * `requestHide` to let listeners prevent it.
   * @param event - What made the toast hide, if anything did.
   */
  async hide(event?: Event): Promise<void> {
    // Hiding sets `open`, which calls `hide` again: only the call that closed the toast removes it, once `hidden` is out.
    const closing = this.opened;
    await super.hide(event);
    // Shown again while hiding, or hidden while removed, it stays where it is.
    if (closing && !this.open && this.isConnected) this.remove();
  }

  /**
   * Takes `source`'s variant, duration and content, as a toast with the same `id` shown again does, and starts over.
   * Emits nothing: the toast was showing and still is.
   * @internal
   */
  update(source: AwcToastElement) {
    for (const name of ['variant', 'duration']) {
      const value = source.getAttribute(name);
      if (value === null) {
        this.removeAttribute(name);
      } else {
        this.setAttribute(name, value);
      }
    }
    const body = source.querySelector('.awc-toast-body');
    const replaced = this.querySelector('.awc-toast-body');
    if (body && replaced) {
      const hadFocus = replaced.contains(document.activeElement);
      replaced.replaceWith(body);
      // What had focus is gone, without a `focusout` in some browsers: focus stays in the toast, and the region pauses
      // by where it is now.
      if (hadFocus) {
        this.focus({ preventScroll: true });
        this.region?.syncFocusPause();
      }
    }
    this.region?.raise();
    this.startOver();
  }

  /**
   * Starts the timer over, from a duration set while the toast is showing.
   * @private
   */
  durationChanged() {
    if (this.opened) this.restartTimer();
  }

  /**
   * Requests to hide the toast on Escape. The Escape goes no further, so that a dialog the toast is in stays open.
   * @private
   */
  handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.requestHide(event);
  }

  /**
   * Whether the toast is fading out: hidden, and about to leave the region.
   * @internal
   */
  get leaving() {
    return this.classList.contains(LEAVING_CLASS);
  }

  /**
   * What screen readers hear when the toast shows: its title, if it has one, then its message.
   * @internal
   */
  get announcement() {
    const [title, message] = ['.awc-toast-title', '.awc-toast-message'].map(
      (selector) => this.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    );
    if (!title) return message;
    // A pause between the two, as a sentence ending gives one.
    return `${/[.!?…:]$/.test(title) ? title : `${title}.`} ${message}`.trim();
  }

  /**
   * Carries on with the toast's timer, unless its region pauses it. Called by the region.
   * @internal
   */
  resumeTimer() {
    if (!this.opened || this.timer !== undefined || !Number.isFinite(this.remaining) || this.region?.paused) return;
    this.startedAt = performance.now();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.remaining = 0;
      this.hide();
    }, this.remaining);
  }

  /**
   * Pauses the toast's timer, keeping what is left of it. Called by the region.
   * @internal
   */
  pauseTimer() {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remaining -= performance.now() - this.startedAt;
  }

  /** Starts the toast's timer, or carries on with it when the toast moved with its region. */
  protected openParts({ initial }: { initial: boolean }) {
    shownToasts.add(this);
    // Shown again while it was leaving.
    this.classList.remove(LEAVING_CLASS);
    if (initial) {
      this.resumeTimer();
      return;
    }
    // Before the toast comes in, as showing the region again would end that.
    this.region?.raise();
    // Only as it shows: a toast moving with its region connects again, and shouldn't come in a second time.
    this.classList.add(ENTERING_CLASS);
    void animationsFinished(this).then(() => this.classList.remove(ENTERING_CLASS));
    this.startOver();
  }

  /** Stops the timer and, unless the toast is moving with its region, fades it out. */
  protected async closeParts(event?: Event) {
    this.pauseTimer();
    if (!this.isConnected) return;
    // Focus inside it moves on before it is removed: to the next toast from the keyboard, which is going through them,
    // and otherwise back to where it was. A press only put it on what was pressed, and code hides a toast whoever is
    // in it.
    if (this.contains(document.activeElement)) {
      this.region?.moveFocusFrom(this, { toNeighbour: isFromKeyboard(event) });
    }
    this.classList.remove(ENTERING_CLASS);
    this.classList.add(LEAVING_CLASS);
    await animationsFinished(this);
  }

  /** Starts the timer from the toast's full duration, and has it announced. */
  private startOver() {
    this.restartTimer();
    const region = this.region;
    if (region) void whenInitialized(region).then(() => region.announce(this));
  }

  /** Starts the timer from the toast's full duration, whatever was left of it. */
  private restartTimer() {
    this.pauseTimer();
    this.remaining = this.timeout;
    this.resumeTimer();
  }

  private get region() {
    return this.parentElement?.closest<AwcToastRegionElement>('awc-toast-region') ?? null;
  }

  /** How long the toast shows for: its own `duration`, else one that follows from its variant and content. */
  private get timeout() {
    if (this.hasAttribute('duration')) return this.duration;
    return this.variant === 'danger' || this.hasAction ? Infinity : DEFAULT_DURATION;
  }

  /** Whether the toast holds something to press or fill in, other than its close button. */
  private get hasAction() {
    // Whatever its display, as a toast is measured as it shows.
    return tabbable(this, { displayCheck: 'none' }).some((element) => !element.closest('.awc-toast-close-btn'));
  }
}

export { AwcToastElement };

declare global {
  interface Window {
    AwcToastElement: typeof AwcToastElement;
  }
  interface HTMLElementTagNameMap {
    'awc-toast': AwcToastElement;
  }
  interface GlobalEventHandlersEventMap {
    'awc-toast:show': CustomEvent<Record<string, never>>;
    'awc-toast:shown': CustomEvent<Record<string, never>>;
    'awc-toast:hide': CustomEvent<Record<string, never>>;
    'awc-toast:hidden': CustomEvent<Record<string, never>>;
  }
}
