/**
 * For the element tests only: it is left out of the build.
 *
 * Waits for the browser's own work, which `whenSettled()` from `@ambiki/impulse/testing` does not cover. Prefer what
 * Impulse offers: `whenSettled()` after changing the DOM, and a Recording's `waitFor()` for an event that comes. These
 * are for what neither can wait on, such as a layout or a scroll, or a check that an event did not come when no other
 * event comes either way.
 */

/** Resolves on the next animation frame. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Resolves after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
