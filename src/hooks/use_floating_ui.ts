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
import { createPositioner, type PositioningOptions } from 'src/internal/positioning';

export type UseFloatingUIType = {
  start: () => void;
  update: () => Promise<void>;
  stop: () => Promise<void>;
};

export type UseFloatingUIOptions = {
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

function toPositioningOptions({
  referenceElement,
  popupElement,
  arrowElement,
  arrowPadding = 0,
  middleware = [],
  offsetOptions = 0,
  placement,
  flipOptions,
  shiftOptions,
  strategy,
  sync,
  autoSize,
  autoSizePadding = 0,
}: UseFloatingUIOptions): PositioningOptions {
  return {
    anchor: referenceElement,
    floating: popupElement,
    placement,
    strategy,
    sync,
    autoSize,
    autoSizePadding,
    arrow: arrowElement,
    arrowPadding,
    floatingUI: { offset: offsetOptions, flip: flipOptions, shift: shiftOptions, middleware },
  };
}

function optionsReader(options: UseFloatingUIOptions | (() => UseFloatingUIOptions)): () => UseFloatingUIOptions {
  if (typeof options === 'function') return options;

  // Copied, so that changing the object later has no effect, as before the function form existed.
  const snapshot = { ...options };
  return () => snapshot;
}

/**
 * Positions `popupElement` against `referenceElement` while `element` is open. Pass a function instead of an object to
 * have the options read every time `popupElement` is repositioned, so that changes (e.g. to an attribute) are picked up.
 * An object is read once, when the hook is created.
 */
export default function useFloatingUI(
  element: ImpulseElement & { open: boolean },
  options: UseFloatingUIOptions | (() => UseFloatingUIOptions)
): UseFloatingUIType {
  const getOptions = optionsReader(options);
  const positioner = createPositioner(() => toPositioningOptions(getOptions()));

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
