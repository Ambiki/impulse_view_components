import type { ImpulseElement } from '@ambiki/impulse';
import type {
  FlipOptions,
  Middleware,
  OffsetOptions,
  Placement,
  ReferenceElement,
  ShiftOptions,
  Strategy,
} from '@floating-ui/dom';
import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

export type UseFloatingUIType = {
  start: () => void;
  update: () => Promise<void>;
  stop: () => Promise<void>;
};

type Options = {
  referenceElement: ReferenceElement;
  popupElement?: HTMLElement;
  arrowElement?: HTMLElement | null;
  arrowPadding?: number;
  middleware?: Middleware[];
  offsetOptions?: OffsetOptions;
  placement?: Placement;
  flipOptions?: FlipOptions;
  shiftOptions?: ShiftOptions;
  strategy?: Strategy;
  sync?: 'height' | 'width' | 'both';
  autoSize?: 'height' | 'width' | 'both';
  autoSizePadding?: number;
};

export default function useFloatingUI(
  element: ImpulseElement & { open: boolean },
  {
    referenceElement,
    popupElement,
    arrowElement,
    arrowPadding = 0,
    middleware = [],
    offsetOptions = 0,
    placement = 'bottom-start',
    flipOptions,
    shiftOptions,
    strategy = 'fixed',
    sync,
    autoSize,
    autoSizePadding = 0,
  }: Options
): UseFloatingUIType {
  let cleanup: ReturnType<typeof autoUpdate> | undefined;

  async function reposition(isOpen = false): Promise<void> {
    if (!isOpen || !referenceElement || !popupElement) return;

    // Middlewares are order dependent: https://floating-ui.com/docs/middleware
    const _middleware: Middleware[] = [offset(offsetOptions)];

    if (sync) {
      _middleware.push(
        size({
          apply: ({ rects }) => {
            const syncWidth = sync === 'width' || sync === 'both';
            const syncHeight = sync === 'height' || sync === 'both';
            popupElement.style.width = syncWidth ? `${rects.reference.width}px` : '';
            popupElement.style.height = syncHeight ? `${rects.reference.height}px` : '';
          },
        })
      );
    } else {
      popupElement.style.width = '';
      popupElement.style.height = '';
    }

    _middleware.push(flip(flipOptions));
    _middleware.push(shift(shiftOptions));

    if (autoSize) {
      _middleware.push(
        size({
          padding: autoSizePadding,
          apply: ({ availableWidth, availableHeight }) => {
            if (autoSize === 'height' || autoSize === 'both') {
              popupElement.style.setProperty('--awc-auto-size-height', `${availableHeight}px`);
            } else {
              popupElement.style.removeProperty('--awc-auto-size-height');
            }

            if (autoSize === 'width' || autoSize === 'both') {
              popupElement.style.setProperty('--awc-auto-size-width', `${availableWidth}px`);
            } else {
              popupElement.style.removeProperty('--awc-auto-size-width');
            }
          },
        })
      );
    } else {
      popupElement.style.removeProperty('--awc-auto-size-height');
      popupElement.style.removeProperty('--awc-auto-size-width');
    }

    if (arrowElement) {
      _middleware.push(
        arrow({
          element: arrowElement,
          padding: arrowPadding,
        })
      );
    }

    _middleware.concat(middleware);

    const {
      x,
      y,
      placement: _placement,
      strategy: _strategy,
      middlewareData,
    } = await computePosition(referenceElement, popupElement, {
      placement,
      middleware: _middleware,
      strategy,
    });
    Object.assign(popupElement.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: _strategy,
    });

    if (middlewareData.arrow && arrowElement) {
      const { x, y } = middlewareData.arrow;
      Object.assign(arrowElement.style, {
        left: typeof x === 'number' ? `${x}px` : '',
        top: typeof y === 'number' ? `${y}px` : '',
      });
    }

    // Bootstrap's arrow depends on this attribute.
    popupElement.setAttribute('x-placement', _placement);
  }

  // Set the initial top and left position to minimize flickering when the popup is toggled on/off.
  function forceStart(): void {
    if (!popupElement) return;
    // Fix floatingUI
    popupElement.style.position = strategy;
    popupElement.style.top = '0px';
    popupElement.style.left = '0px';

    if (!referenceElement) return;
    cleanup = autoUpdate(referenceElement, popupElement, () => reposition(true));
    stop();
  }

  function start(): void {
    if (!referenceElement || !popupElement) return;
    cleanup = autoUpdate(referenceElement, popupElement, () => reposition(element.open));
  }

  async function update() {
    await reposition(element.open);
  }

  async function stop(): Promise<void> {
    return new Promise((resolve) => {
      if (cleanup) {
        cleanup();
        cleanup = undefined;
        requestAnimationFrame(() => resolve());
      } else {
        resolve();
      }
    });
  }

  forceStart();

  const disconnectedCallback = element.disconnected.bind(element);
  Object.assign(element, {
    disconnected() {
      stop();
      disconnectedCallback();
    },
  });

  return { start, update, stop } as const;
}
