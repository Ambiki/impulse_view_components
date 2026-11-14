const locks = new Set<Element>();

/** The body's own styles from before the first lock, to put back once the last lock is released. */
let bodyStyles: { overflow: string; paddingRight: string } | null = null;

/**
 * Hides the page's scroll bar by setting `overflow: hidden` on the `body` element, padding it by the scroll bar's
 * width so that the page doesn't shift. The page stays locked until every element that locked it is released, in any
 * order: by aborting the returned controller, or the signal passed as `abortSignal`.
 */
export default function scrollLock(element: Element, { abortSignal }: { abortSignal?: AbortSignal } = {}) {
  const controller = new AbortController();
  const signal = abortSignal || controller.signal;

  if (locks.size === 0) {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    bodyStyles = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
    if (scrollBarWidth > 0) {
      const paddingRight = Number.parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'), 10);
      document.body.style.paddingRight = `${paddingRight + scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
  }
  locks.add(element);

  const release = () => {
    locks.delete(element);
    if (locks.size !== 0 || !bodyStyles) return;
    document.body.style.overflow = bodyStyles.overflow;
    document.body.style.paddingRight = bodyStyles.paddingRight;
    bodyStyles = null;
  };
  if (signal.aborted) {
    release();
  } else {
    signal.addEventListener('abort', release, { once: true });
  }

  return controller;
}
