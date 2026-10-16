import { ImpulseElement, property, registerElement } from '@ambiki/impulse';
import type { Placement, Strategy } from '@floating-ui/dom';
import { stripCSSUnit } from 'src/helpers/string';
import { createPositioner, positioningDefaults, type PositioningOptions } from 'src/internal/positioning';

@registerElement('awc-anchor')
export default class AwcAnchorElement extends ImpulseElement {
  /**
   * The `id` attribute of the anchor element that the popup will be anchored to.
   */
  @property() anchorId: string;

  /**
   * The preferred placement of the element. The actual placement may vary to keep the element inside the viewport.
   */
  @property() placement: Placement = positioningDefaults.placement;

  /**
   * Activates the positioning logic.
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
  @property() sync?: 'height' | 'width' | 'both';

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
  @property({ type: Array }) fallbackPlacements = [];

  /**
   * When no placements fit, then we want to decide what happens next. `bestFit` will use the placement which fits
   * best on the checked axis whereas `initialPlacement` will use the initial `placement` specified.
   */
  @property() fallbackStrategy: 'bestFit' | 'initialPlacement' = 'bestFit';

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
  @property() autoSize?: 'height' | 'width' | 'both';

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
    // Start positioning the element immediately.
    this.start();
  }

  disconnected() {
    this.stop();
  }

  async anchorIdChanged(newValue: string) {
    await this.stop();
    if (newValue && this.anchorElement) {
      this.start();
    }
  }

  async activeChanged(newValue: boolean) {
    if (newValue) {
      this.start();
    } else {
      await this.stop();
    }
  }

  start() {
    if (!this.anchorElement) return;
    this.positioner.prime();
    this.positioner.start(() => this.reposition());
  }

  async stop(): Promise<void> {
    return this.positioner.stop();
  }

  async reposition() {
    if (!this.active || !this.anchorElement) return;
    await this.positioner.reposition();
  }

  get anchorElement() {
    return document.getElementById(this.anchorId);
  }

  get arrowElement() {
    return this.querySelector<HTMLElement>('[data-arrow]');
  }

  private get positioningOptions(): PositioningOptions {
    const arrowElement = this.arrowElement;
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
      arrow: arrowElement,
      arrowPadding: arrowElement ? this._arrowPadding : undefined,
    };
  }

  private get _arrowPadding() {
    if (typeof this.arrowPadding === 'number') {
      return this.arrowPadding;
    }
    const borderRadius = getComputedStyle(this).borderRadius;
    return stripCSSUnit(borderRadius) || 2;
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
