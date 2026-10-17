/**
 * The open and close behaviour that `<awc-popover>`, `<awc-dialog>` and `<awc-autocomplete>` share. It is internal: the
 * package's `exports` map doesn't list it. Its public members reach apps, though, through the elements that extend it,
 * so changing those changes the public API. See docs/adr/0002-events-follow-native-elements.md and
 * docs/adr/0003-open-is-the-element-state.md.
 *
 * - `requestShow` and `requestHide`, which user actions go through, emit a cancelable request event (`show`, `hide`)
 *   first, and do nothing if it is prevented.
 * - `show`, `hide` and changing `open` act directly, and emit only the state event (`shown`, `hidden`).
 * - Connecting already open, moving and removing emit nothing. A removed element keeps `open`, and opens again when it
 *   reconnects.
 *
 * A subclass declares `open` with `@property({ type: Boolean })`, since impulse reads only a class's own property
 * declarations. It implements `openParts` and `closeParts`, and calls `super.connected()` at the end of its own
 * `connected`, and `super.disconnected()` at the start of its own `disconnected`.
 */
import { ImpulseElement, isInitialized } from '@ambiki/impulse';

export default abstract class OpenableElement extends ImpulseElement {
  /**
   * Whether the element is open. Setting it shows or hides the element, as `show` and `hide` do.
   */
  abstract open: boolean;

  /** See `opened`. */
  private _opened = false;

  /**
   * Called when the element is added to the DOM. Subclasses call it last, once what `openParts` needs is set up.
   */
  connected() {
    // Starting out open isn't a change, so it emits nothing.
    if (this.open) {
      this.openQuietly({ initial: true });
    }
  }

  /**
   * Called when the element is removed from the DOM. Subclasses call it first.
   */
  disconnected() {
    // Removal emits nothing, and keeps `open`, so the element opens again if it's reconnected.
    this.closeQuietly();
  }

  /**
   * Shows or hides the element when `open` changes, as `show` and `hide` do.
   * @private
   */
  openChanged(open: boolean) {
    if (open) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Shows the element as if the user asked to. Emits a cancelable `show`, then makes any request that showing depends
   * on, such as a popover asking the other open popovers to hide. Does nothing if any of them is prevented.
   */
  requestShow() {
    if (!isInitialized(this) || this._opened || !this.emitRequest('show') || !this.othersAllowShow()) return;
    this.show();
  }

  /**
   * Hides the element as if the user asked to. Emits a cancelable `hide`, and does nothing if it is prevented.
   * @param event - What made the element hide, if anything did.
   */
  async requestHide(event?: Event): Promise<void> {
    if (!this._opened || !this.emitRequest('hide')) return;
    await this.hide(event);
  }

  /**
   * Shows the element. Emits `shown` but no `show`: use `requestShow` to let listeners prevent it.
   */
  show() {
    if (this._opened) return;
    if (!isInitialized(this)) {
      // Its targets aren't wired up yet: it opens, silently, once it connects.
      this.open = true;
      return;
    }
    this.openQuietly({ initial: false });
    this.emit('shown');
  }

  /**
   * Hides the element. Emits `hidden` but no `hide`: use `requestHide` to let listeners prevent it.
   * @param event - What made the element hide, if anything did.
   */
  async hide(event?: Event): Promise<void> {
    if (!this._opened) {
      // Nothing is open, such as while the element is removed, so there is only `open` to clear.
      this.open = false;
      return;
    }
    const closed = this.closeQuietly(event);
    // After closing, so that `openChanged` finds nothing left to do.
    this.open = false;
    // Awaited only when closing takes time, so that an element that closes at once reports it at once.
    if (closed) {
      await closed;
    }
    // Shown again before the hide finished, so there is no close left to report.
    if (!this._opened) {
      this.emit('hidden');
    }
  }

  /**
   * The state the element last opened or closed itself to. `open` differs from it while the element is handling a
   * change to `open`, and while the element isn't initialized.
   */
  protected get opened() {
    return this._opened;
  }

  /**
   * Opens the element's parts: what it shows, such as its panel, dialog or listbox, and whatever follows from that.
   * `initial` is `true` when the element connects already open, which isn't a change: it shouldn't, for example, take
   * focus.
   */
  protected abstract openParts(options: { initial: boolean }): void;

  /**
   * Closes the element's parts. `event` is what made it close, if anything did. Returns a promise when closing takes
   * time, during which the element may be shown again.
   */
  protected abstract closeParts(event?: Event): void | Promise<void>;

  /**
   * Makes the requests that showing the element depends on, once its own `show` wasn't prevented, and returns whether
   * all of them were allowed.
   */
  protected othersAllowShow(): boolean {
    return true;
  }

  /** Emits the request event `name`, returning whether the element may go ahead. */
  protected emitRequest(name: 'show' | 'hide') {
    return !this.emit(name, { cancelable: true }).defaultPrevented;
  }

  /** Closes the element's parts without emitting, and leaves `open` as it is. */
  protected closeQuietly(event?: Event) {
    if (!this._opened) return;
    this._opened = false;
    return this.closeParts(event);
  }

  /** Opens the element's parts without emitting, and sets `open`. */
  private openQuietly(options: { initial: boolean }) {
    this._opened = true;
    // After `_opened`, so that `openChanged` finds nothing left to do.
    this.open = true;
    try {
      this.openParts(options);
    } catch (error) {
      // It didn't open, so it mustn't say it did.
      this._opened = false;
      this.open = false;
      throw error;
    }
  }
}
