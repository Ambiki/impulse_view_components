// A consumer-shaped fixture: every public subpath of the package, imported the way an
// application would import it. Type-checked with `moduleResolution: bundler` and `node16`,
// both of which honour the `exports` map, so a subpath that stops resolving fails here with
// TS2307.
//
// Every import binds a name on purpose. TypeScript does not report TS2307 for side-effect
// imports (`import 'pkg/subpath';`), so a bare side-effect import would let a broken subpath
// through unnoticed.
//
// See `scripts/check-exports.mjs`.

/* eslint-disable perfectionist/sort-imports -- grouped by kind of subpath, as the comments describe */
import * as root from '@ambiki/impulse-view-components';
import * as rootIndex from '@ambiki/impulse-view-components/dist/index.js';

import * as anchor from '@ambiki/impulse-view-components/dist/elements/anchor';
import * as autocomplete from '@ambiki/impulse-view-components/dist/elements/autocomplete';
import * as dialog from '@ambiki/impulse-view-components/dist/elements/dialog';
import * as popover from '@ambiki/impulse-view-components/dist/elements/popover';

// Explicit `index.js` form kept working for consumers that adopted it as a workaround.
import * as autocompleteIndex from '@ambiki/impulse-view-components/dist/elements/autocomplete/index.js';

// Addressable non-index modules inside an element directory.
import * as ajaxSearch from '@ambiki/impulse-view-components/dist/elements/autocomplete/ajax_search';
import * as localSearch from '@ambiki/impulse-view-components/dist/elements/autocomplete/local_search';
import * as multipleSelect from '@ambiki/impulse-view-components/dist/elements/autocomplete/multiple_select';
import * as singleSelect from '@ambiki/impulse-view-components/dist/elements/autocomplete/single_select';

import useFloatingUI from '@ambiki/impulse-view-components/dist/hooks/use_floating_ui';
import useFocusOut from '@ambiki/impulse-view-components/dist/hooks/use_focus_out';
import useOutsideClick from '@ambiki/impulse-view-components/dist/hooks/use_outside_click';

import { isLooselyFocusable } from '@ambiki/impulse-view-components/dist/helpers/focus';
import * as array from '@ambiki/impulse-view-components/dist/helpers/array';
import * as debounce from '@ambiki/impulse-view-components/dist/helpers/debounce';
import * as scrollLock from '@ambiki/impulse-view-components/dist/helpers/scroll_lock';
import * as string from '@ambiki/impulse-view-components/dist/helpers/string';
import * as uniqueId from '@ambiki/impulse-view-components/dist/helpers/unique_id';

// Types must come through the `types` condition, not just the runtime file.
import type AmbikiAutocompleteElement from '@ambiki/impulse-view-components/dist/elements/autocomplete';
import type AmbikiDialogElement from '@ambiki/impulse-view-components/dist/elements/dialog';
import type AmbikiPopoverElement from '@ambiki/impulse-view-components/dist/elements/popover';
import type AmbikiAnchorElement from '@ambiki/impulse-view-components/dist/elements/anchor';
import type { UseFloatingUIOptions } from '@ambiki/impulse-view-components/dist/hooks/use_floating_ui';
import type { VirtualElement } from '@floating-ui/dom';
import type { AwcAutocompleteCommitEvent } from '@ambiki/impulse-view-components/dist/elements/autocomplete';

export const used = {
  root,
  rootIndex,
  anchor,
  autocomplete,
  autocompleteIndex,
  dialog,
  popover,
  ajaxSearch,
  localSearch,
  multipleSelect,
  singleSelect,
  useFloatingUI,
  useFocusOut,
  useOutsideClick,
  isLooselyFocusable,
  array,
  debounce,
  scrollLock,
  string,
  uniqueId,
};

export interface Elements {
  autocomplete: AmbikiAutocompleteElement;
  dialog: AmbikiDialogElement;
  popover: AmbikiPopoverElement;
}

// Positioning types must reach the consumer as their real unions. A declaration that imports them through a path the
// consumer can't resolve degrades them to `any` without an error, because library checks are skipped; each
// `@ts-expect-error` below then has nothing to suppress and fails instead.
// @ts-expect-error: not a placement
export const notAPlacement: UseFloatingUIOptions['placement'] = 'middle';
// @ts-expect-error: not a placement
export const notAPopoverPlacement: AmbikiPopoverElement['placement'] = 'middle';
// @ts-expect-error: not a fallback strategy
export const notAFallbackStrategy: AmbikiAnchorElement['fallbackStrategy'] = 'nearest';
// @ts-expect-error: an event's `value` is a string
export const notACommitValue: AwcAutocompleteCommitEvent['value'] = 1;
// @ts-expect-error: an event's `selected` is a boolean
export const notACommitSelected: AwcAutocompleteCommitEvent['selected'] = 'true';

// The hook still takes everything Floating UI's `ReferenceElement` does: a Floating UI `VirtualElement`, and a virtual
// element with `getClientRects` (which Floating UI's `inline()` middleware reads).
declare const virtualElement: VirtualElement;
const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
export const anchorFromVirtualElement: UseFloatingUIOptions['anchorElement'] = virtualElement;
export const anchorWithClientRects: UseFloatingUIOptions['anchorElement'] = {
  getBoundingClientRect: () => rect,
  getClientRects: () => [rect],
};

// The import paths the docs teach (ADR 0008). Everything above imports the deprecated `dist/` paths, which apps still
// use.
/* eslint-disable import/first -- kept apart from the `dist/` imports above */
import { AwcAnchorElement } from '@ambiki/impulse-view-components/anchor';
import { AwcAutocompleteElement } from '@ambiki/impulse-view-components/autocomplete';
import { AwcDialogElement } from '@ambiki/impulse-view-components/dialog';
import { AwcPopoverElement } from '@ambiki/impulse-view-components/popover';
import type {
  Placement as AnchorPlacement,
  Side as AnchorSide,
  Strategy as AnchorStrategy,
  Dimension,
  DimensionOrBoth,
  FallbackStrategy,
} from '@ambiki/impulse-view-components/anchor';
import type {
  Placement as PopoverPlacement,
  Side as PopoverSide,
  Strategy as PopoverStrategy,
} from '@ambiki/impulse-view-components/popover';
import {
  useFloatingUI as namedUseFloatingUI,
  useFocusOut as namedUseFocusOut,
  useOutsideClick as namedUseOutsideClick,
} from '@ambiki/impulse-view-components/hooks';
import type {
  Anchor,
  AnchorRect,
  Boundary,
  Dimension as HookDimension,
  DimensionOrBoth as HookDimensionOrBoth,
  Placement as HookPlacement,
  Side as HookSide,
  Strategy as HookStrategy,
  UseFloatingUIOptions as NamedUseFloatingUIOptions,
  UseFloatingUIType,
  UseFocusOutOptions,
  UseOutsideClickOptions,
  VirtualAnchor,
} from '@ambiki/impulse-view-components/hooks';
import {
  // @ts-expect-error: only the public helpers are on the helpers path; the rest stay on the `dist/` paths
  uniqueId as internalUniqueId,
  isLooselyFocusable as namedIsLooselyFocusable,
} from '@ambiki/impulse-view-components/helpers';
/* eslint-enable import/first */

export const namedHelpers: [typeof isLooselyFocusable, unknown] = [namedIsLooselyFocusable, internalUniqueId];

// The hooks path exports each hook by name, the same function as its default export on the `dist/` path.
export const namedHooks: [typeof useFloatingUI, typeof useFocusOut, typeof useOutsideClick] = [
  namedUseFloatingUI,
  namedUseFocusOut,
  namedUseOutsideClick,
];

// ...and every type the hooks' APIs mention, as their real types.
// @ts-expect-error: not a side
export const notAnAnchorSide: AnchorSide = 'middle';
// @ts-expect-error: not a side
export const notAPopoverSide: PopoverSide = 'middle';
// @ts-expect-error: not a side
export const notAHookSide: HookSide = 'middle';
// @ts-expect-error: not a placement
export const notAHookPlacement: HookPlacement = 'middle';
// @ts-expect-error: not a strategy
export const notAHookStrategy: HookStrategy = 'sticky';
// @ts-expect-error: not a dimension
export const notAHookDimension: HookDimension = 'depth';
// @ts-expect-error: not a dimension or both
export const notAHookDimensionOrBoth: HookDimensionOrBoth = 'neither';
// @ts-expect-error: a rectangle has numeric sides
export const notAnAnchorRect: AnchorRect = { ...rect, top: '0' };
// @ts-expect-error: a virtual anchor reports where it is
export const notAVirtualAnchor: VirtualAnchor = {};
// @ts-expect-error: an anchor is an element or a virtual anchor
export const notAnAnchor: Anchor = 'button';
// @ts-expect-error: a boundary is an element or null
export const notABoundary: Boundary = 'button';
// @ts-expect-error: the options need an anchor
export const notFloatingUIOptions: NamedUseFloatingUIOptions = {};
// @ts-expect-error: a hook's controls are functions
export const notFloatingUIControls: UseFloatingUIType = { start: true, update: true, stop: true };
// @ts-expect-error: focus-out options need boundaries and a callback
export const notFocusOutOptions: UseFocusOutOptions = {};
// @ts-expect-error: outside-click options need boundaries and a callback
export const notOutsideClickOptions: UseOutsideClickOptions = {};

// Each element path exports the positioning types its properties use, as their real unions.
// @ts-expect-error: not a placement
export const notAnAnchorPlacement: AnchorPlacement = 'middle';
// @ts-expect-error: not a strategy
export const notAnAnchorStrategy: AnchorStrategy = 'sticky';
// @ts-expect-error: not a fallback strategy
export const notAnAnchorFallbackStrategy: FallbackStrategy = 'nearest';
// @ts-expect-error: not a dimension
export const notADimension: Dimension = 'depth';
// @ts-expect-error: not a dimension or both
export const notADimensionOrBoth: DimensionOrBoth = 'neither';
// @ts-expect-error: not a placement
export const notAPopoverPlacementByName: PopoverPlacement = 'middle';
// @ts-expect-error: not a strategy
export const notAPopoverStrategy: PopoverStrategy = 'sticky';

// Each element path exports its class by name, alongside the default export.
export const namedClasses: [typeof anchor.default, typeof autocomplete.default, typeof dialog.default, typeof popover.default] = [
  AwcAnchorElement,
  AwcAutocompleteElement,
  AwcDialogElement,
  AwcPopoverElement,
];
// @ts-expect-error: a plain element is not a popover
export const notAPopover: AwcPopoverElement = document.createElement('div');
// @ts-expect-error: a plain element is not an anchor
export const notAnAnchorElement: AwcAnchorElement = document.createElement('div');
// @ts-expect-error: a plain element is not a dialog
export const notADialog: AwcDialogElement = document.createElement('div');
// @ts-expect-error: a plain element is not an autocomplete
export const notAnAutocomplete: AwcAutocompleteElement = document.createElement('div');
