import { ImpulseElement, property, registerElement } from '@ambiki/impulse';
import {
  createPositioner,
  positioningDefaults,
  type DimensionOrBoth,
  type FallbackStrategy,
  type Placement,
  type PositioningOptions,
  type Strategy,
} from 'src/internal/positioning';

@registerElement('awc-anchor')
export default class AwcAnchorElement extends ImpulseElement {
  /**
   * The `id` of the element to position against.
   */
  @property() anchorId: string;

  /**
   * The preferred placement of the element. The actual placement may vary to keep the element inside the viewport.
   */
  @property() placement: Placement = positioningDefaults.placement;

  /**
   * Whether the element is positioned. `start` and `stop` set it.
   */
  @property({ type: Boolean }) active = false;

  /**
   * The `position` value of the CSS property.
   */
  @property() strategy: Strategy = positioningDefaults.strategy;

  /**
   * The distance in pixels from which to offset the panel away from its anchor.
   */
  @property({ type: Number }) distance = 0;

  /**
   * The distance in pixels from which to offset the panel along its anchor.
   */
  @property({ type: Number }) skidding = 0;

  /**
   * Syncs the element's height or width to that of the anchor element.
   */
  @property() sync?: DimensionOrBoth;

  /**
   * When `true`, the element will be flipped to the fallback placements to keep the element inside the viewport.
   */
  @property({ type: Boolean }) flip: boolean = positioningDefaults.flip;

  /**
   * The amount of padding in pixels before flipping the element.
   */
  @property({ type: Number }) flipPadding = 0;

  /**
   * If the preferred placement does not keep the element inside the viewport, element will be tested in these
   * placements until one of them fits.
   */
  @property({ type: Array }) fallbackPlacements: Placement[] = [];

  /**
   * When no placements fit, then we want to decide what happens next. `bestFit` will use the placement which fits
   * best on the checked axis whereas `initialPlacement` will use the initial `placement` specified.
   */
  @property() fallbackStrategy: FallbackStrategy = 'bestFit';

  /**
   * When `true`, the element will be shifted along its axis to keep the element inside the viewport.
   */
  @property({ type: Boolean }) shift: boolean = positioningDefaults.shift;

  /**
   * The amount of padding in pixels before shifting the element.
   */
  @property({ type: Number }) shiftPadding = 0;

  /**
   * Exposes the space available to the element as the `--awc-auto-size-height` and `--awc-auto-size-width` CSS custom
   * properties, e.g. to cap its height with `max-height: var(--awc-auto-size-height)`.
   */
  @property() autoSize?: DimensionOrBoth;

  /**
   * The amount of padding in pixels to keep from the viewport edge when measuring the available space.
   */
  @property({ type: Number }) autoSizePadding = 0;

  /**
   * The padding between the arrow and the edges of the element.
   */
  @property({ type: Number }) arrowPadding: number;

  private positioner = createPositioner(() => this.positioningOptions);

  connected() {
    // Lay the element out straight away; it is only positioned once `active`.
    this.follow();
  }

  disconnected() {
    // Leaves `active` alone, so that the element resumes once it's reconnected.
    this.unfollow();
  }

  async anchorIdChanged(newValue: string) {
    await this.unfollow();
    if (newValue && this.anchorElement) {
      this.follow();
    }
  }

  async activeChanged(newValue: boolean) {
    if (newValue) {
      this.follow();
    } else {
      await this.unfollow();
    }
  }

  /**
   * Activates the element, and keeps it positioned next to its anchor until `stop` is called.
   */
  start() {
    if (this.active) {
      this.follow();
    } else {
      // `activeChanged` starts following.
      this.active = true;
    }
  }

  /**
   * Deactivates the element, and stops keeping it positioned. Resolves on the next frame.
   */
  async stop(): Promise<void> {
    // Taken before deactivating, which would otherwise have already stopped it and leave nothing to wait for.
    const stopped = this.unfollow();
    this.active = false;
    return stopped;
  }

  async reposition() {
    if (!this.active || !this.anchorElement) return;
    await this.positioner.reposition();
  }

  private follow() {
    if (!this.anchorElement) return;
    this.positioner.prime();
    this.positioner.start(() => this.reposition());
  }

  private unfollow(): Promise<void> {
    return this.positioner.stop();
  }

  get anchorElement() {
    return document.getElementById(this.anchorId);
  }

  get arrowElement() {
    return this.querySelector<HTMLElement>('[data-arrow]');
  }

  private get positioningOptions(): PositioningOptions {
    return {
      anchor: this.anchorElement,
      floating: this,
      placement: this.placement,
      strategy: this.strategy,
      distance: this.distance,
      skidding: this.skidding,
      flip: this.flip && {
        padding: this.flipPadding,
        fallbackPlacements: this.fallbackPlacements.length ? this.fallbackPlacements : undefined,
        fallbackStrategy: this.fallbackStrategy,
      },
      shift: this.shift && { padding: this.shiftPadding },
      sync: this.sync,
      autoSize: this.autoSize,
      autoSizePadding: this.autoSizePadding,
      arrow: this.arrowElement,
      arrowPadding: this.arrowPadding,
    };
  }
}

declare global {
  interface Window {
    AwcAnchorElement: typeof AwcAnchorElement;
  }
  interface HTMLElementTagNameMap {
    'awc-anchor': AwcAnchorElement;
  }
}
