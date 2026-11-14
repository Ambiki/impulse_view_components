import type AwcToastElement from './toast';
import type { ToastVariant } from './toast';
import {
  ImpulseElement,
  on,
  property,
  registerElement,
  target,
  connected as whenConnected,
  whenInitialized,
} from '@ambiki/impulse';
import { keepFocusOn } from 'src/internal/focus';
import supportsPopover from 'src/internal/supports_popover';

/** Where on the screen the region shows its toasts. */
export type ToastPlacement = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

/** What pauses the toasts' timers: the user looking at them or busy elsewhere. */
type PauseReason = 'hover' | 'focus' | 'window blur' | 'tab hidden';

/** What `showToast` builds a toast from, besides its content. */
export interface ToastOptions {
  /** What kind of message the toast is. Defaults to `info`. */
  variant?: ToastVariant;
  /** The toast's `id`. */
  id?: string;
  /** How long, in milliseconds, the toast shows; `Infinity` keeps it until it is dismissed. */
  duration?: number;
  /** A title, shown above the message. */
  title?: string;
}

@registerElement('awc-toast-region')
export default class AwcToastRegionElement extends ImpulseElement {
  /**
   * Where on the screen the toasts show. The newest toast is nearest the edge.
   */
  @property() placement: ToastPlacement = 'top-center';

  /**
   * The key that moves focus to the newest toast, and back to where it was. Empty for none.
   */
  @property() hotkey = 'F8';

  /** The toast that `showToast` builds a toast from. */
  @target() template: HTMLTemplateElement;

  /** Where a toast's text goes to be heard, politely: after what the screen reader is saying. */
  @target() politeAnnouncer: HTMLElement;

  /** Where a danger toast's text goes to be heard at once. */
  @target() assertiveAnnouncer: HTMLElement;

  /** The toasts waiting to be heard through each announcer, with their text, which are written together. */
  private readonly pendingAnnouncements = new Map<HTMLElement, Map<AwcToastElement, string>>();

  /** Each announcer's timeout for emptying it once its text has been heard. */
  private readonly announcementTimeouts = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

  /** Where focus was before it moved into the region, by the hotkey or by Tab, for it to return to. */
  private returnFocusTo: HTMLElement | null = null;

  /** What is pausing the toasts' timers. They run while it is empty. */
  private readonly pauseReasons = new Set<PauseReason>();

  private listeners?: AbortController;

  /** Where the layout rendered the region, for it to return to once no modal dialog is open. */
  private layoutParent: Element | null = null;

  /** The open modal dialogs, in the order they opened: the last one is on top. */
  private modalDialogs: HTMLDialogElement[] = [];

  connected() {
    if (!this.layoutParent && !this.closest('dialog')) this.layoutParent = this.parentElement;
    this.followTopmostModalDialog();

    this.listeners = new AbortController();
    const { signal } = this.listeners;
    // Captured, as `pointerenter` and `pointerleave` don't bubble.
    on('pointerenter', this.localName, this.handlePointerenter, { capture: true, signal });
    on('pointerleave', this.localName, this.handlePointerleave, { capture: true, signal });
    on('focusin', this.localName, this.handleFocusin, { signal });
    on('focusout', this.localName, this.handleFocusout, { signal });
    signal.addEventListener('abort', whenConnected('dialog[open]', this.handleDialogOpen));
    document.addEventListener('keydown', this.handleHotkey, { signal });
    window.addEventListener('blur', () => this.setPaused('window blur', true), { signal });
    window.addEventListener('focus', () => this.setPaused('window blur', false), { signal });
    document.addEventListener('visibilitychange', () => this.setPaused('tab hidden', document.hidden), { signal });
    window.addEventListener('pageshow', this.handlePageshow, { signal });
    this.setPaused('tab hidden', document.hidden);
    // Moving into a dialog or out of it drops focus without a `focusout`.
    this.syncFocusPause();
  }

  disconnected() {
    this.listeners?.abort();
  }

  /**
   * Whether the toasts' timers are paused: while the pointer is over the region or focus is in it, and while the window
   * or the tab is in the background.
   * @internal
   */
  get paused() {
    return this.pauseReasons.size > 0;
  }

  /**
   * The toasts in the region, oldest first.
   * @internal
   */
  get toasts(): AwcToastElement[] {
    return Array.from(this.children).filter((element): element is AwcToastElement => element.localName === 'awc-toast');
  }

  /**
   * Shows a toast built from `content`: a message, or a template holding a toast. A toast with the `id` of one already
   * showing updates that one in place instead. Resolves with the toast once it is showing.
   * @internal
   */
  async showToast(content: string | HTMLTemplateElement, options: ToastOptions = {}): Promise<AwcToastElement> {
    this.followTopmostModalDialog();
    const toast = this.buildToast(content, options);
    const existing = toast.id ?
      this.toasts.find((element) => element.id === toast.id && !element.classList.contains('awc-toast--leaving')) :
      undefined;
    if (existing) {
      // One added just before may still be starting up, and shows once it has.
      await whenInitialized(existing);
      if (existing.isConnected && existing.open) {
        existing.update(toast);
        return existing;
      }
    }
    this.append(toast);
    await whenInitialized(toast);
    return toast;
  }

  /**
   * Has screen readers announce `toast`, assertively for a danger toast and politely otherwise. Toasts shown together
   * are written together, so that each is heard. The visible toasts aren't live regions themselves: moving the region
   * into a dialog and out could have them read again. The announcers are emptied once heard, so they have nothing to
   * repeat either.
   * @internal
   */
  announce(toast: AwcToastElement) {
    const announcer = toast.variant === 'danger' ? this.assertiveAnnouncer : this.politeAnnouncer;
    // A toast updated before it was heard is heard once, as it is now: a loading toast that has already failed isn't
    // heard loading as well.
    for (const batch of this.pendingAnnouncements.values()) batch.delete(toast);
    const pending = this.pendingAnnouncements.get(announcer);
    if (pending) {
      pending.set(toast, toast.announcement);
      return;
    }
    const batch = new Map([[toast, toast.announcement]]);
    this.pendingAnnouncements.set(announcer, batch);
    clearTimeout(this.announcementTimeouts.get(announcer));
    announcer.replaceChildren();
    // Written a couple of frames later, so that screen readers hear a change even when the text is what they last
    // heard, and so that NVDA in Firefox hears it at all.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.pendingAnnouncements.delete(announcer);
        announcer.replaceChildren(
          ...Array.from(batch.values(), (text) => Object.assign(document.createElement('div'), { textContent: text })),
        );
        this.announcementTimeouts.set(
          announcer,
          setTimeout(() => announcer.replaceChildren(), 1000),
        );
      });
    });
  }

  /**
   * Moves focus out of `toast`, which is hiding: to the toast before it, else the one after it, else back to where it
   * was before it moved into the region.
   * @internal
   */
  moveFocusFrom(toast: AwcToastElement) {
    const toasts = this.toasts;
    const index = toasts.indexOf(toast);
    const others = toasts.filter((element) => element !== toast && element.open);
    const before = others.filter((element) => toasts.indexOf(element) < index);
    const next = before[before.length - 1] ?? others.find((element) => toasts.indexOf(element) > index);
    if (next) {
      next.focus();
    } else {
      this.returnFocus();
    }
  }

  /**
   * Pauses the timers for focus in the region, or carries on with them, by where focus is now. A move or a removal
   * drops focus without the `focusout` the region would otherwise hear.
   * @internal
   */
  syncFocusPause() {
    this.setPaused('focus', this.contains(document.activeElement));
  }

  /**
   * Moves the region into the topmost open modal dialog, or back to where the layout rendered it once none is open, and
   * shows it in the top layer. A modal dialog makes everything outside it inert, toasts in the top layer above it too,
   * so they couldn't be pressed or heard (ADR 0022).
   */
  private followTopmostModalDialog = () => {
    this.modalDialogs = this.modalDialogs.filter((dialog) => dialog.matches(':modal'));
    // An open one the region hasn't heard of yet opened before the ones it has.
    for (const dialog of document.querySelectorAll('dialog')) this.recordModalDialog(dialog);
    const target = this.modalDialogs[this.modalDialogs.length - 1] ?? this.layoutParent;
    // Moving closes a popover, and showing it again puts it above the dialog in the top layer.
    if (target && this.parentElement !== target) target.append(this);
    if (supportsPopover() && !this.matches(':popover-open')) this.showPopover();
  };

  /** Records `dialog` as the topmost one when it is modal and newly open. */
  private recordModalDialog(dialog: HTMLDialogElement) {
    if (dialog.matches(':modal') && !this.modalDialogs.includes(dialog)) this.modalDialogs.push(dialog);
  }

  /** Moves focus back to where it was before it moved into the region, or out of the region when that is gone. */
  private returnFocus() {
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    keepFocusOn(target?.isConnected ? target : null);
  }

  /** Pauses every toast's timer while `reason` holds, and carries on with them once nothing pauses them. */
  private setPaused(reason: PauseReason, paused: boolean) {
    const wasPaused = this.paused;
    if (paused) {
      this.pauseReasons.add(reason);
    } else {
      this.pauseReasons.delete(reason);
    }
    if (wasPaused === this.paused) return;
    for (const toast of this.toasts) {
      if (this.paused) {
        toast.pauseTimer();
      } else {
        toast.resumeTimer();
      }
    }
  }

  /**
   * Builds a toast from `content`, or from the region's template with `content` as its message. The template's toast
   * has a title, which is filled in, or removed when there is none.
   */
  private buildToast(content: string | HTMLTemplateElement, { variant, id, duration, title }: ToastOptions) {
    const fromMessage = typeof content === 'string';
    const source = (fromMessage ? this.template : content).content.querySelector('awc-toast')!;
    const toast = source.cloneNode(true) as AwcToastElement;
    if (fromMessage) toast.querySelector('.awc-toast-message')!.textContent = content;
    const titleElement = toast.querySelector('.awc-toast-title');
    if (title !== undefined && titleElement) {
      titleElement.textContent = title;
    } else if (fromMessage) {
      titleElement?.remove();
    }
    if (variant) toast.setAttribute('variant', variant);
    if (id) toast.id = id;
    if (duration !== undefined) toast.setAttribute('duration', String(duration));
    return toast;
  }

  /**
   * Follows a dialog as it opens, and once it closes. The move waits for the watcher to finish, as moving the region
   * stops it, and with it this watch.
   */
  private handleDialogOpen = (dialog: HTMLDialogElement) => {
    this.recordModalDialog(dialog);
    queueMicrotask(this.followTopmostModalDialog);
    return () => queueMicrotask(this.followTopmostModalDialog);
  };

  // Only the region's own enter and leave count: a toast's leave, delegated to the region, isn't the pointer leaving it.
  private handlePointerenter = (event: PointerEvent) => {
    if (event.target === this) this.setPaused('hover', true);
  };

  private handlePointerleave = (event: PointerEvent) => {
    if (event.target === this) this.setPaused('hover', false);
  };

  private handleFocusin = (event: FocusEvent) => {
    if (event.currentTarget !== this) return;
    const from = event.relatedTarget;
    if (!this.returnFocusTo && from instanceof HTMLElement && !this.contains(from)) this.returnFocusTo = from;
    this.setPaused('focus', true);
  };

  private handleFocusout = (event: FocusEvent) => {
    if (event.currentTarget !== this) return;
    const to = event.relatedTarget as Node | null;
    if (this.contains(to)) return;
    this.setPaused('focus', false);
    // Moved on by the user, focus has nowhere to return to.
    if (to) this.returnFocusTo = null;
  };

  private handleHotkey = (event: KeyboardEvent) => {
    if (!this.hotkey || event.key !== this.hotkey || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (this.contains(document.activeElement)) {
      event.preventDefault();
      this.returnFocus();
      return;
    }
    const open = this.toasts.filter((toast) => toast.open);
    const newest = open[open.length - 1];
    if (!newest) return;
    event.preventDefault();
    this.returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    newest.focus();
  };

  /** A page the browser restores from its back-forward cache shows none of the toasts it had. */
  private handlePageshow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    for (const toast of this.toasts) toast.remove();
  };
}

export { AwcToastRegionElement };

declare global {
  interface Window {
    AwcToastRegionElement: typeof AwcToastRegionElement;
  }
  interface HTMLElementTagNameMap {
    'awc-toast-region': AwcToastRegionElement;
  }
}
