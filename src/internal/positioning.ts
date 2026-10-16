/**
 * The positioning engine behind `useFloatingUI` and `<awc-anchor>`. It is internal: the package's `exports` map doesn't
 * list it, so `createPositioner` and its options can change freely. Its vocabulary types (`Placement`, `Strategy`,
 * `Anchor`, `DimensionOrBoth`, `FallbackStrategy`) do reach apps, though, through the public faces' declarations, so
 * changing those changes the public API. See docs/adr/0001-single-positioning-engine-two-faces.md.
 *
 * The engine owns the defaults that every public face shares (`positioningDefaults`), so the faces can't drift apart.
 * Options are read through a function on every reposition, so a face can reflect changes (e.g. to an attribute) without
 * re-creating the positioner.
 */
import type { FlipOptions, Middleware, OffsetOptions, ShiftOptions } from '@floating-ui/dom';
import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

/** A side of the anchor. */
type Side = 'top' | 'right' | 'bottom' | 'left';

/** Where the floating element sits against its anchor: a side, optionally aligned to that side's start or end. */
export type Placement = Side | `${Side}-${'start' | 'end'}`;

/** The CSS `position` the floating element is laid out with. */
export type Strategy = 'absolute' | 'fixed';

/** A rectangle in viewport coordinates. */
interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Something that only knows where it is on screen, such as a pointer position, standing in for an anchor element. It
 * accepts everything Floating UI's `VirtualElement` does.
 */
export interface VirtualAnchor {
  getBoundingClientRect: () => AnchorRect;
  /** The rectangles of each line box, for an anchor that wraps across lines (read by Floating UI's `inline()`). */
  getClientRects?: (() => Array<AnchorRect> | DOMRectList) | undefined;
  /** The element the virtual anchor belongs to, used to find the scroll containers to watch. */
  contextElement?: Element | undefined;
}

/** The element (or a virtual anchor) that a floating element is positioned against. */
export type Anchor = Element | VirtualAnchor;

/** One of the floating element's dimensions. */
export type Dimension = 'height' | 'width';

/** Which of the floating element's dimensions an option applies to: one, or both. */
export type DimensionOrBoth = Dimension | 'both';

/** What to do when no placement fits: use the one that fits best, or keep the preferred one. */
export type FallbackStrategy = 'bestFit' | 'initialPlacement';

function covers(value: DimensionOrBoth, dimension: Dimension): boolean {
  return value === dimension || value === 'both';
}

export interface FlipConfig {
  /** Padding in pixels to keep from the viewport edge before flipping. */
  padding?: number;
  /** Placements to try, in order, when the preferred one doesn't fit. */
  fallbackPlacements?: Placement[];
  /** What to do when no placement fits. */
  fallbackStrategy?: FallbackStrategy;
}

export interface ShiftConfig {
  /** Padding in pixels to keep from the viewport edge while shifting. */
  padding?: number;
}

/**
 * Raw Floating UI options, for callers that need more than the engine's own vocabulary. Only the Floating UI backend
 * reads them, so using any of them ties a floating element to that backend.
 */
export interface FloatingUIPassthrough {
  /** Replaces `distance` and `skidding`. */
  offset?: OffsetOptions;
  /** Merged over `flip` when flipping is enabled. */
  flip?: FlipOptions;
  /** Merged over `shift` when shifting is enabled. */
  shift?: ShiftOptions;
  /** Runs after the built-in middleware and before the arrow is aligned. */
  middleware?: Middleware[];
}

/** The defaults shared by every face. An omitted offset or padding means zero. */
export const positioningDefaults: {
  placement: Placement;
  strategy: Strategy;
  flip: boolean;
  shift: boolean;
} = {
  placement: 'bottom',
  strategy: 'fixed',
  flip: true,
  shift: true,
};

export interface PositioningOptions {
  anchor?: Anchor | null;
  floating?: HTMLElement | null;
  placement?: Placement;
  strategy?: Strategy;
  /** Offset in pixels away from the anchor. */
  distance?: number;
  /** Offset in pixels along the anchor. */
  skidding?: number;
  /** Flips to another placement to stay inside the viewport, or `false` to keep the placement. */
  flip?: FlipConfig | boolean;
  /** Shifts along the anchor to stay inside the viewport, or `false` to let it overflow. */
  shift?: ShiftConfig | boolean;
  /** Matches the floating element's size to the anchor's. */
  sync?: DimensionOrBoth;
  /** Exposes the space available to the floating element as `--awc-auto-size-height` and `--awc-auto-size-width`. */
  autoSize?: DimensionOrBoth;
  /** Padding in pixels to keep from the viewport edge when measuring the available space. */
  autoSizePadding?: number;
  arrow?: HTMLElement | null;
  /** Padding in pixels between the arrow and the floating element's edges. */
  arrowPadding?: number;
  floatingUI?: FloatingUIPassthrough;
}

export interface Positioner {
  /** Lays the floating element out at the viewport's origin, so that it doesn't flash elsewhere before it's placed. */
  prime: () => void;
  /** Positions the floating element once. */
  reposition: () => Promise<void>;
  /**
   * Calls `onUpdate` whenever the anchor or the floating element moves or resizes, until `stop` is called. The face
   * decides whether to `reposition` from there. The anchor and floating element are read once, when starting.
   */
  start: (onUpdate: () => void) => void;
  /** Stops keeping the floating element positioned. Resolves on the next frame. */
  stop: () => Promise<void>;
}

export function createPositioner(getOptions: () => PositioningOptions): Positioner {
  let cleanup: ReturnType<typeof autoUpdate> | undefined;
  // Only clear the auto size custom properties once they've been set here, so that an author's own are left alone.
  let autoSized = false;
  // Bumped by every reposition. One that a later reposition has overtaken must not write anything, or its result
  // (e.g. an auto size custom property the later one just cleared) would land on top.
  let generation = 0;

  function prime() {
    const { floating, strategy = positioningDefaults.strategy } = getOptions();
    if (!floating) return;

    floating.style.position = strategy;
    floating.style.top = '0px';
    floating.style.left = '0px';
  }

  async function reposition() {
    const options = getOptions();
    const { anchor, floating, floatingUI = {} } = options;
    if (!anchor || !floating) return;
    const current = ++generation;
    const isStale = () => current !== generation;

    // Middlewares are order dependent: https://floating-ui.com/docs/middleware
    const middleware: Middleware[] = [
      offset(floatingUI.offset ?? { mainAxis: options.distance ?? 0, crossAxis: options.skidding ?? 0 }),
    ];

    const { sync } = options;
    if (sync) {
      middleware.push(
        size({
          apply: ({ rects }) => {
            if (isStale()) return;
            floating.style.width = covers(sync, 'width') ? `${rects.reference.width}px` : '';
            floating.style.height = covers(sync, 'height') ? `${rects.reference.height}px` : '';
          },
        }),
      );
    } else {
      floating.style.width = '';
      floating.style.height = '';
    }

    const flipConfig = options.flip ?? positioningDefaults.flip;
    if (flipConfig) {
      middleware.push(flip({ ...(flipConfig === true ? {} : flipConfig), ...floatingUI.flip }));
    }

    const shiftConfig = options.shift ?? positioningDefaults.shift;
    if (shiftConfig) {
      middleware.push(shift({ ...(shiftConfig === true ? {} : shiftConfig), ...floatingUI.shift }));
    }

    const { autoSize } = options;
    if (autoSize) {
      middleware.push(
        size({
          padding: options.autoSizePadding ?? 0,
          apply: ({ availableWidth, availableHeight }) => {
            if (isStale()) return;
            if (covers(autoSize, 'height')) {
              floating.style.setProperty('--awc-auto-size-height', `${availableHeight}px`);
            } else {
              floating.style.removeProperty('--awc-auto-size-height');
            }

            if (covers(autoSize, 'width')) {
              floating.style.setProperty('--awc-auto-size-width', `${availableWidth}px`);
            } else {
              floating.style.removeProperty('--awc-auto-size-width');
            }
          },
        }),
      );
      autoSized = true;
    } else if (autoSized) {
      floating.style.removeProperty('--awc-auto-size-height');
      floating.style.removeProperty('--awc-auto-size-width');
      autoSized = false;
    }

    // Custom middleware may move the floating element, so it runs before the arrow is aligned to the final position.
    middleware.push(...(floatingUI.middleware ?? []));

    const arrowElement = options.arrow;
    if (arrowElement) {
      middleware.push(arrow({ element: arrowElement, padding: options.arrowPadding ?? 0 }));
    }

    const { x, y, placement, strategy, middlewareData } = await computePosition(anchor, floating, {
      placement: options.placement ?? positioningDefaults.placement,
      middleware,
      strategy: options.strategy ?? positioningDefaults.strategy,
    });
    if (isStale()) return;

    Object.assign(floating.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: strategy,
    });

    if (middlewareData.arrow && arrowElement) {
      const { x, y } = middlewareData.arrow;
      Object.assign(arrowElement.style, {
        left: typeof x === 'number' ? `${x}px` : '',
        top: typeof y === 'number' ? `${y}px` : '',
      });
    }

    // Bootstrap's arrow depends on this attribute.
    floating.setAttribute('x-placement', placement);
  }

  function start(onUpdate: () => void) {
    const { anchor, floating } = getOptions();
    if (!anchor || !floating) return;

    // Starting twice would otherwise leave the first `autoUpdate` running with nothing left to stop it.
    cleanup?.();
    cleanup = autoUpdate(anchor, floating, onUpdate);
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

  return { prime, reposition, start, stop };
}
