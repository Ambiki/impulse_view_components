/**
 * Hides the scroll bar by setting `overflow: hidden` on the `body` element.
 */
export default function scrollLock({ abortSignal }: { abortSignal?: AbortSignal } = {}) {
  const controller = new AbortController();
  const signal = abortSignal || controller.signal;
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  let prevPaddingRight: string | undefined;
  let prevOverflowSetting: string | undefined;

  if (prevPaddingRight === undefined && scrollBarWidth > 0) {
    const computedBodyPaddingRight = parseInt(
      window.getComputedStyle(document.body).getPropertyValue('padding-right'),
      10
    );

    prevPaddingRight = document.body.style.paddingRight;
    document.body.style.paddingRight = `${computedBodyPaddingRight + scrollBarWidth}px`;
  }

  if (prevOverflowSetting === undefined) {
    prevOverflowSetting = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  signal.addEventListener('abort', () => {
    if (prevPaddingRight !== undefined) {
      document.body.style.paddingRight = prevPaddingRight;
      prevPaddingRight = undefined;
    }

    if (prevOverflowSetting !== undefined) {
      document.body.style.overflow = prevOverflowSetting;
      prevOverflowSetting = undefined;
    }
  });

  return controller;
}
