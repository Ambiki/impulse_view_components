/**
 * Has screen readers hear text, by writing it into live regions. It is internal: the package's `exports` map doesn't
 * list it.
 *
 * What is announced together is written together, so that each text is heard: a live region written twice in a row
 * says only what it was last given. A live region is emptied once it has been heard, so that it has nothing to repeat
 * when it moves in the page.
 */

/** How long, in milliseconds, a live region keeps its text for screen readers to hear, before it is emptied. */
const HEARD_AFTER = 1000;

/**
 * `Subject` is what a text is about, such as a toast. A subject has one text waiting to be heard at most: announced
 * again before it was heard, it is heard once, as it is now.
 */
export default class LiveAnnouncer<Subject extends object> {
  /** The subjects waiting to be heard through each live region, with their text, which are written together. */
  private readonly pending = new Map<HTMLElement, Map<Subject, string>>();

  /** Each live region's timeout for emptying it once its text has been heard. */
  private readonly timeouts = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

  /**
   * Writes `text`, which is about `subject`, into `liveRegion`, with whatever else is announced through it meanwhile.
   */
  announce(liveRegion: HTMLElement, subject: Subject, text: string) {
    // A subject announced again before it was heard is heard once, as it is now, through whichever live region that
    // is: a loading toast that has already failed isn't heard loading as well.
    for (const batch of this.pending.values()) batch.delete(subject);
    const pending = this.pending.get(liveRegion);
    if (pending) {
      pending.set(subject, text);
      return;
    }
    const batch = new Map([[subject, text]]);
    this.pending.set(liveRegion, batch);
    clearTimeout(this.timeouts.get(liveRegion));
    liveRegion.replaceChildren();
    // Written a couple of frames later, so that screen readers hear a change even when the text is what they last
    // heard, and so that NVDA in Firefox hears it at all.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.pending.delete(liveRegion);
        liveRegion.replaceChildren(
          ...Array.from(batch.values(), (line) => Object.assign(document.createElement('div'), { textContent: line })),
        );
        this.timeouts.set(
          liveRegion,
          setTimeout(() => liveRegion.replaceChildren(), HEARD_AFTER),
        );
      });
    });
  }
}
