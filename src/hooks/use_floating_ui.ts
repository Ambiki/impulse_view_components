import type { ImpulseElement } from '@ambiki/impulse';
import type { FlipOptions, Middleware, OffsetOptions, ShiftOptions } from '@floating-ui/dom';
import type { Anchor, DimensionOrBoth, Placement, PositioningOptions, Strategy } from 'src/internal/positioning';
import onDisconnect from 'src/internal/on_disconnect';
import { createPositioner } from 'src/internal/positioning';

export interface UseFloatingUIType {
  start: () => void;
  update: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface UseFloatingUIOptions {
  anchorElement: Anchor;
  floatingElement?: HTMLElement;
  arrowElement?: HTMLElement | null;
  arrowPadding?: number;
  middleware?: Middleware[];
  offsetOptions?: OffsetOptions;
  placement?: Placement;
  flipOptions?: FlipOptions;
  keepFlipped?: boolean;
  shiftOptions?: ShiftOptions;
  strategy?: Strategy;
  sync?: DimensionOrBoth;
  autoSize?: DimensionOrBoth;
  autoSizePadding?: number;
}

function toPositioningOptions({
  anchorElement,
  floatingElement,
  arrowElement,
  arrowPadding = 0,
  middleware = [],
  offsetOptions = 0,
  placement,
  flipOptions,
  shiftOptions,
  keepFlipped,
  strategy,
  sync,
  autoSize,
  autoSizePadding = 0,
}: UseFloatingUIOptions): PositioningOptions {
  return {
    anchor: anchorElement,
    floating: floatingElement,
    placement,
    keepFlipped,
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
 * Positions `floatingElement` against `anchorElement` while `element` is open. Pass a function instead of an object to
 * have the options read every time `floatingElement` is repositioned, so that changes (e.g. to an attribute) are picked
 * up. An object is read once, when the hook is created.
 */
export default function useFloatingUI(
  element: ImpulseElement & { open: boolean },
  options: UseFloatingUIOptions | (() => UseFloatingUIOptions),
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

  // Set the initial top and left position, then place `floatingElement` once, to minimize flickering when it's toggled.
  positioner.prime();
  positioner.reposition();

  onDisconnect(element, () => {
    stop();
  });

  return { start, update, stop } as const;
}
