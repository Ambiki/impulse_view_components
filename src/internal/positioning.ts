/**
 * The positioning engine behind `useFloatingUI` and `<awc-anchor>`. It is internal: the package's `exports` map doesn't
 * list it, so `createPositioner` and its options can change freely. Its vocabulary types (`Placement`, `Side`,
 * `Strategy`, `Anchor`, `VirtualAnchor`, `AnchorRect`, `Dimension`, `DimensionOrBoth`, `FallbackStrategy`) are public,
 * though: each public face's import path exports the ones its API uses, so changing them changes the public API. See
 * docs/adr/0001-single-positioning-engine-two-faces.md and docs/adr/0008-one-import-path-per-thing.md.
 *
 * The engine owns the defaults that every public face shares (`positioningDefaults`), so the faces can't drift apart.
 * Options are read through a function on every reposition, so a face can reflect changes (e.g. to an attribute) without
 * re-creating the positioner.
 */
import type { FlipOptions, Middleware, OffsetOptions, Padding, ShiftOptions } from '@floating-ui/dom';
import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

/** A side of the anchor. */
export type Side = 'top' | 'right' | 'bottom' | 'left';

/** Where the floating element sits against its anchor: a side, optionally aligned to that side's start or end. */
export type Placement = Side | `${Side}-${'start' | 'end'}`;

/** The CSS `position` the floating element is laid out with. */
export type Strategy = 'absolute' | 'fixed';

/** A rectangle in viewport coordinates. */
export interface AnchorRect {
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

function sideOf(placement: Placement): Side {
  return placement.split('-')[0] as Side;
}

/**
 * The placements to try when `preferred` doesn't fit. While `keepFlipped` prefers a side other than the `requested`
 * one, `requested` is tried first, so that the floating element can still flip back to it. Without `fallbacks`,
 * Floating UI tries the opposite of `preferred`, which is already `requested`.
 */
function fallbacksWithRequestedFirst(
  fallbacks: Placement[] | undefined,
  requested: Placement,
  preferred: Placement,
): Placement[] | undefined {
  if (!fallbacks || preferred === requested) return fallbacks;
  return [requested, ...fallbacks].filter((placement) => placement !== preferred);
}

/**
 * The placement to try first while `keepFlipped` keeps the side of `kept`, the placement last used. On the `requested`
 * side, that's `requested`, so that its alignment can still flip back. On another side, it's `kept` itself when there
 * are `fallbacks`, so that it stays among the placements they allow. Otherwise it's `requested` moved to that side,
 * the opposite placement Floating UI falls back to.
 */
function keptPlacement(requested: Placement, kept: Placement, fallbacks: Placement[] | undefined): Placement {
  const side = sideOf(kept);
  if (side === sideOf(requested)) return requested;
  return fallbacks ? kept : withSide(requested, side);
}

/** `placement` moved to `side`, keeping its alignment. */
function withSide(placement: Placement, side: Side): Placement {
  const alignment = placement.split('-')[1];
  return (alignment ? `${side}-${alignment}` : side) as Placement;
}

/**
 * A floating element capped to its available space fills that space exactly once it is squashed, so it never
 * overflows, and flip would leave it squashed even when the other side has more room. Keeping flip's padding past
 * `autoSizePadding` on the auto sized axis makes a squashed element count as overflowing, so it flips whenever the other
 * side fits it better. Base UI's positioning does the same.
 */
function flipPadding(padding = 0, { autoSize, autoSizePadding = 0 }: PositioningOptions): Padding {
  if (!autoSize) return padding;

  const squashedPadding = Math.max(padding, autoSizePadding + 1);
  const vertical = covers(autoSize, 'height') ? squashedPadding : padding;
  const horizontal = covers(autoSize, 'width') ? squashedPadding : padding;
  return { top: vertical, bottom: vertical, left: horizontal, right: horizontal };
}

export interface FlipConfig {
  /**
   * Padding in pixels to keep from the viewport edge before flipping. Raised past `autoSizePadding` on the auto sized
   * axis while `autoSize` is set.
   */
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
  keepFlipped: boolean;
  shift: boolean;
} = {
  placement: 'bottom',
  strategy: 'fixed',
  flip: true,
  keepFlipped: false,
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
  /**
   * Keeps the side the floating element flipped to until `stop` is called, instead of trying `placement` first on every
   * reposition, so that it doesn't jump back once its content shrinks. It still flips again when that side stops fitting.
   */
  keepFlipped?: boolean;
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
  // The placement the floating element was last placed at while `keepFlipped` was set, and the placement that was
  // requested then. Cleared by `stop`, so that the next start tries the requested placement first.
  let kept: { placement: Placement; requested: Placement } | undefined;

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

    const requestedPlacement = options.placement ?? positioningDefaults.placement;
    const flipConfig = options.flip ?? positioningDefaults.flip;
    const flipSettings = flipConfig === true || !flipConfig ? {} : flipConfig;
    // The passthrough wins over the engine's own fallbacks, as it does over every flip option.
    const fallbacks = floatingUI.flip?.fallbackPlacements ?? flipSettings.fallbackPlacements;
    if (!flipConfig || !options.keepFlipped || kept?.requested !== requestedPlacement) kept = undefined;
    const preferredPlacement = kept ? keptPlacement(requestedPlacement, kept.placement, fallbacks) : requestedPlacement;

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

    if (flipConfig) {
      middleware.push(
        flip({
          ...flipSettings,
          padding: flipPadding(flipSettings.padding, options),
          ...floatingUI.flip,
          fallbackPlacements: fallbacksWithRequestedFirst(fallbacks, requestedPlacement, preferredPlacement),
        }),
      );
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
      placement: preferredPlacement,
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

    // Only kept while started, so that a reposition before `start` doesn't pin the side for the next start.
    if (options.keepFlipped && cleanup) kept = { placement, requested: requestedPlacement };
  }

  function start(onUpdate: () => void) {
    const { anchor, floating } = getOptions();
    if (!anchor || !floating) return;

    // Starting twice would otherwise leave the first `autoUpdate` running with nothing left to stop it.
    cleanup?.();
    cleanup = autoUpdate(anchor, floating, onUpdate);
  }

  async function stop(): Promise<void> {
    kept = undefined;
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
