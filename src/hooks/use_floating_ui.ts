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
import { createPositioner } from 'src/internal/positioning';

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
  const positioner = createPositioner(() => ({
    anchor: referenceElement,
    floating: popupElement,
    placement,
    strategy,
    // The hook always flips and shifts; `flipOptions` and `shiftOptions` only tune how.
    flip: {},
    shift: {},
    sync,
    autoSize,
    autoSizePadding,
    arrow: arrowElement,
    arrowPadding,
    floatingUI: { offset: offsetOptions, flip: flipOptions, shift: shiftOptions, middleware },
  }));

  function start(): void {
    positioner.start(update);
  }

  async function update() {
    if (!element.open) return;
    await positioner.reposition();
  }

  function stop(): Promise<void> {
    return positioner.stop();
  }

  // Set the initial top and left position, then place `popupElement` once, to minimize flickering when it's toggled.
  positioner.prime();
  positioner.reposition();

  const disconnectedCallback = element.disconnected.bind(element);
  Object.assign(element, {
    disconnected() {
      stop();
      disconnectedCallback();
    },
  });

  return { start, update, stop } as const;
}
