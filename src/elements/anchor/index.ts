import { ImpulseElement, property, registerElement } from '@ambiki/impulse';
import type { Middleware, Placement, Strategy } from '@floating-ui/dom';
import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';
import { stripCSSUnit } from 'src/helpers/string';

@registerElement('awc-anchor')
export default class AwcAnchorElement extends ImpulseElement {
  /**
   * The `id` attribute of the anchor element that the popup will be anchored to.
   */
  @property() anchorId: string;

  /**
   * The preferred placement of the element. The actual placement may vary to keep the element inside the viewport.
   */
  @property() placement: Placement = 'bottom';

  /**
   * Activates the positioning logic.
   */
  @property({ type: Boolean }) active = false;

  /**
   * The `position` value of the CSS property.
   */
  @property() strategy: Strategy = 'fixed';

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
  @property({ type: Boolean }) flip = true;

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
  @property({ type: Boolean }) shift = false;

  /**
   * The amount of padding in pixels before shifting the element.
   */
  @property({ type: Number }) shiftPadding = 0;

  /**
   * The padding between the arrow and the edges of the element.
   */
  @property({ type: Number }) arrowPadding: number;

  private cleanup?: ReturnType<typeof autoUpdate>;

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
    // Fix floatingUI.
    this.style.position = this.strategy;
    this.style.top = '0px';
    this.style.left = '0px';
    this.cleanup = autoUpdate(this.anchorElement, this, this.reposition.bind(this));
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = undefined;
        requestAnimationFrame(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async reposition() {
    if (!this.active || !this.anchorElement) return;
    const middleware: Middleware[] = [offset({ mainAxis: this.distance, crossAxis: this.skidding })];

    if (this.sync) {
      middleware.push(
        size({
          apply: ({ rects }) => {
            const syncWidth = this.sync === 'width' || this.sync === 'both';
            const syncHeight = this.sync === 'height' || this.sync === 'both';
            this.style.width = syncWidth ? `${rects.reference.width}px` : '';
            this.style.height = syncHeight ? `${rects.reference.height}px` : '';
          },
        })
      );
    } else {
      this.style.width = '';
      this.style.height = '';
    }

    if (this.flip) {
      middleware.push(
        flip({
          fallbackPlacements: this.fallbackPlacements.length ? this.fallbackPlacements : undefined,
          fallbackStrategy: this.fallbackStrategy,
          padding: this.flipPadding,
        })
      );
    }

    if (this.shift) {
      middleware.push(
        shift({
          padding: this.shiftPadding,
        })
      );
    }

    if (this.arrowElement) {
      middleware.push(
        arrow({
          element: this.arrowElement,
          padding: this._arrowPadding,
        })
      );
    }

    const { x, y, placement, strategy, middlewareData } = await computePosition(this.anchorElement, this, {
      placement: this.placement,
      middleware,
      strategy: this.strategy,
    });

    Object.assign(this.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: strategy,
    });

    if (middlewareData.arrow && this.arrowElement) {
      const { x, y } = middlewareData.arrow;
      Object.assign(this.arrowElement.style, {
        left: typeof x === 'number' ? `${x}px` : '',
        top: typeof y === 'number' ? `${y}px` : '',
      });
    }
    // Bootstrap requires this attribute.
    this.setAttribute('x-placement', placement);
  }

  get anchorElement() {
    return document.getElementById(this.anchorId);
  }

  get arrowElement() {
    return this.querySelector<HTMLElement>('[data-arrow]');
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
}
