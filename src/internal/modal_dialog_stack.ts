/**
 * The open modal dialogs, in the order they opened, for an element that has to sit in the one on top: a modal dialog
 * makes everything outside it inert (docs/adr/0022-the-toast-region-follows-the-topmost-modal-dialog.md). It is
 * internal: the package's `exports` map doesn't list it.
 *
 * The DOM doesn't say which modal dialog is on top, so the stack records each one as it opens.
 */
import { connected, on } from '@ambiki/impulse';

export default class ModalDialogStack {
  /** The open modal dialogs, in the order they opened: the last one is on top. */
  private dialogs: HTMLDialogElement[] = [];

  /**
   * The open modal dialog on top, or `null` when none is open.
   */
  topmost() {
    this.dialogs = this.dialogs.filter((dialog) => dialog.matches(':modal'));
    // One the stack hasn't heard of yet is taken for the newest: it opened just now, before a watch could report it, or
    // before anything watched.
    for (const dialog of document.querySelectorAll('dialog')) this.record(dialog);
    return this.dialogs[this.dialogs.length - 1] ?? null;
  }

  /**
   * Records the dialogs as they open, and calls `onChange` as one opens and as one closes. Returns a function that
   * stops watching. Stopping calls `onChange` once more for each dialog still open, as it does when one closes: the
   * watch won't be there to report it.
   */
  watch(onChange: () => void) {
    const stopWatching = connected('dialog[open]', (dialog: HTMLDialogElement) => {
      this.record(dialog);
      onChange();
      return onChange;
    });
    // A dialog closed and opened again in one task was open whenever the watch looked, so it reports neither. The
    // dialog's `close` still comes, and finds it open: it is then the one opened last. Captured, as `close` doesn't
    // bubble.
    const stopListening = on(
      'close',
      'dialog',
      (event) => {
        const dialog = event.currentTarget as HTMLDialogElement;
        if (!dialog.matches(':modal')) return;
        this.dialogs = this.dialogs.filter((other) => other !== dialog);
        this.dialogs.push(dialog);
        onChange();
      },
      { capture: true },
    );
    return () => {
      stopListening();
      stopWatching();
    };
  }

  /** Records `dialog` as the topmost one when it is modal and newly open. */
  private record(dialog: HTMLDialogElement) {
    if (dialog.matches(':modal') && !this.dialogs.includes(dialog)) this.dialogs.push(dialog);
  }
}
