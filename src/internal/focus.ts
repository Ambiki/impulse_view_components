/**
 * Focus management for the elements that open: where focus goes when one opens, and whether it returns when one closes.
 * It is internal: the package's `exports` map doesn't list it. See
 * docs/adr/0004-popovers-use-the-top-layer-and-manage-focus.md.
 */
import { focusable, tabbable } from 'tabbable';

/**
 * Moves focus into `container`, as a non-modal dialog does when it opens: to its element with `autofocus`, else the
 * first element in its tab order, else `container` itself, which needs a `tabindex` for that.
 */
export function focusInto(container: HTMLElement) {
  const target =
    focusable(container).find((element) => element.hasAttribute('autofocus')) ?? tabbable(container)[0] ?? container;
  // Positioning follows, so scrolling to where the element is before that would only make the page jump.
  target.focus({ preventScroll: true });
}

/**
 * Whether closing `container` should return focus to where it was opened from: focus is inside it, or lost to `<body>`.
 * When focus has moved on to something else, such as a field clicked outside, it stays there.
 */
export function focusIsInsideOrLost(container: HTMLElement) {
  const active = document.activeElement;
  return !active || active === document.body || container.contains(active);
}

/** Puts focus back on `element` after something else moved it, or nowhere when nothing had it. */
export function keepFocusOn(element: Element | null) {
  if (element instanceof HTMLElement && element !== document.body) {
    element.focus({ preventScroll: true });
  } else {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
