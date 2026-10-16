/**
 * The positioning engine behind `useFloatingUI` and `<awc-anchor>`. It is internal: nothing here is exported from the
 * package, so its interface can change freely. See docs/adr/0001-single-positioning-engine-two-faces.md.
 *
 * The engine has no behavioural defaults: each public face supplies its own placement, strategy, flip and shift, and an
 * omitted offset or padding means zero. Options are read through a function on every reposition, so a face can reflect
 * changes (e.g. to an attribute) without re-creating the positioner.
 */
import type {
  FlipOptions,
  Middleware,
  OffsetOptions,
  Placement as FloatingUIPlacement,
  ReferenceElement,
  ShiftOptions,
  Strategy as FloatingUIStrategy,
} from '@floating-ui/dom';
import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

/** The element (or a virtual element, such as a pointer position) that a floating element is positioned against. */
export type Anchor = ReferenceElement;

export type Placement = FloatingUIPlacement;

/** The `position` the floating element is laid out with. */
export type Strategy = FloatingUIStrategy;

export type Dimension = 'height' | 'width' | 'both';

export type FlipConfig = {
  /** Padding in pixels to keep from the viewport edge before flipping. */
  padding?: number;
  /** Placements to try, in order, when the preferred one doesn't fit. */
  fallbackPlacements?: Placement[];
  /** What to do when no placement fits. */
  fallbackStrategy?: 'bestFit' | 'initialPlacement';
};

export type ShiftConfig = {
  /** Padding in pixels to keep from the viewport edge while shifting. */
  padding?: number;
};

/**
 * Raw Floating UI options, for callers that need more than the engine's own vocabulary. Only the Floating UI backend
 * reads them, so using any of them ties a floating element to that backend.
 */
export type FloatingUIPassthrough = {
  /** Replaces `distance` and `skidding`. */
  offset?: OffsetOptions;
  /** Merged over `flip` when flipping is enabled. */
  flip?: FlipOptions;
  /** Merged over `shift` when shifting is enabled. */
  shift?: ShiftOptions;
  /** Runs after the built-in middleware and before the arrow is aligned. */
  middleware?: Middleware[];
};

export type PositioningOptions = {
  anchor?: Anchor | null;
  floating?: HTMLElement | null;
  placement: Placement;
  strategy: Strategy;
  /** Offset in pixels away from the anchor. */
  distance?: number;
  /** Offset in pixels along the anchor. */
  skidding?: number;
  /** Flips to another placement to stay inside the viewport, or `false` to keep the placement. */
  flip: FlipConfig | false;
  /** Shifts along the anchor to stay inside the viewport, or `false` to let it overflow. */
  shift: ShiftConfig | false;
  /** Matches the floating element's size to the anchor's. */
  sync?: Dimension;
  /** Exposes the space available to the floating element as `--awc-auto-size-height` and `--awc-auto-size-width`. */
  autoSize?: Dimension;
  /** Padding in pixels to keep from the viewport edge when measuring the available space. */
  autoSizePadding?: number;
  arrow?: HTMLElement | null;
  /** Padding in pixels between the arrow and the floating element's edges. */
  arrowPadding?: number;
  floatingUI?: FloatingUIPassthrough;
};

export type Positioner = {
  /** Lays the floating element out at the viewport's origin, so that it doesn't flash elsewhere before it's placed. */
  prime(): void;
  /** Positions the floating element once. */
  reposition(): Promise<void>;
  /**
   * Calls `onUpdate` whenever the anchor or the floating element moves or resizes, until `stop` is called. The face
   * decides whether to `reposition` from there. The anchor and floating element are read once, when starting.
   */
  start(onUpdate: () => void): void;
  /** Stops keeping the floating element positioned. Resolves on the next frame. */
  stop(): Promise<void>;
};

export function createPositioner(getOptions: () => PositioningOptions): Positioner {
  let cleanup: ReturnType<typeof autoUpdate> | undefined;
  // Only clear the auto size custom properties once they've been set here, so that an author's own are left alone.
  let autoSized = false;

  function prime() {
    const { floating, strategy } = getOptions();
    if (!floating) return;

    floating.style.position = strategy;
    floating.style.top = '0px';
    floating.style.left = '0px';
  }

  async function reposition() {
    const options = getOptions();
    const { anchor, floating, floatingUI = {} } = options;
    if (!anchor || !floating) return;

    // Middlewares are order dependent: https://floating-ui.com/docs/middleware
    const middleware: Middleware[] = [
      offset(floatingUI.offset ?? { mainAxis: options.distance ?? 0, crossAxis: options.skidding ?? 0 }),
    ];

    const { sync } = options;
    if (sync) {
      middleware.push(
        size({
          apply: ({ rects }) => {
            const syncWidth = sync === 'width' || sync === 'both';
            const syncHeight = sync === 'height' || sync === 'both';
            floating.style.width = syncWidth ? `${rects.reference.width}px` : '';
            floating.style.height = syncHeight ? `${rects.reference.height}px` : '';
          },
        })
      );
    } else {
      floating.style.width = '';
      floating.style.height = '';
    }

    if (options.flip) {
      middleware.push(flip({ ...options.flip, ...floatingUI.flip }));
    }

    if (options.shift) {
      middleware.push(shift({ ...options.shift, ...floatingUI.shift }));
    }

    const { autoSize } = options;
    if (autoSize) {
      middleware.push(
        size({
          padding: options.autoSizePadding ?? 0,
          apply: ({ availableWidth, availableHeight }) => {
            if (autoSize === 'height' || autoSize === 'both') {
              floating.style.setProperty('--awc-auto-size-height', `${availableHeight}px`);
            } else {
              floating.style.removeProperty('--awc-auto-size-height');
            }

            if (autoSize === 'width' || autoSize === 'both') {
              floating.style.setProperty('--awc-auto-size-width', `${availableWidth}px`);
            } else {
              floating.style.removeProperty('--awc-auto-size-width');
            }
          },
        })
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
      placement: options.placement,
      middleware,
      strategy: options.strategy,
    });

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
