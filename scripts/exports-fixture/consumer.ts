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

import * as root from '@ambiki/impulse-view-components';
import * as rootIndex from '@ambiki/impulse-view-components/dist/index.js';

import * as anchor from '@ambiki/impulse-view-components/dist/elements/anchor';
import * as autocomplete from '@ambiki/impulse-view-components/dist/elements/autocomplete';
import * as dialog from '@ambiki/impulse-view-components/dist/elements/dialog';
import * as popover from '@ambiki/impulse-view-components/dist/elements/popover';

// Explicit `index.js` form kept working for consumers that adopted it as a workaround.
import * as autocompleteIndex from '@ambiki/impulse-view-components/dist/elements/autocomplete/index.js';

// Addressable non-index modules inside an element directory.
import * as localSearch from '@ambiki/impulse-view-components/dist/elements/autocomplete/local_search';
import * as multipleSelect from '@ambiki/impulse-view-components/dist/elements/autocomplete/multiple_select';
import * as remoteSearch from '@ambiki/impulse-view-components/dist/elements/autocomplete/remote_search';
import * as singleSelect from '@ambiki/impulse-view-components/dist/elements/autocomplete/single_select';

import useFloatingUI from '@ambiki/impulse-view-components/dist/hooks/use_floating_ui';
import useOutsideClick from '@ambiki/impulse-view-components/dist/hooks/use_outside_click';

import { isLooselyFocusable } from '@ambiki/impulse-view-components/dist/helpers/focus';
import * as array from '@ambiki/impulse-view-components/dist/helpers/array';
import * as debounce from '@ambiki/impulse-view-components/dist/helpers/debounce';
import * as focusTrap from '@ambiki/impulse-view-components/dist/helpers/focus_trap';
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

export const used = {
  root,
  rootIndex,
  anchor,
  autocomplete,
  autocompleteIndex,
  dialog,
  popover,
  localSearch,
  multipleSelect,
  remoteSearch,
  singleSelect,
  useFloatingUI,
  useOutsideClick,
  isLooselyFocusable,
  array,
  debounce,
  focusTrap,
  scrollLock,
  string,
  uniqueId,
};

export type Elements = {
  autocomplete: AmbikiAutocompleteElement;
  dialog: AmbikiDialogElement;
  popover: AmbikiPopoverElement;
};

// Positioning types must reach the consumer as their real unions. A declaration that imports them through a path the
// consumer can't resolve degrades them to `any` without an error, because library checks are skipped; each
// `@ts-expect-error` below then has nothing to suppress and fails instead.
// @ts-expect-error: not a placement
export const notAPlacement: UseFloatingUIOptions['placement'] = 'middle';
// @ts-expect-error: not a placement
export const notAPopoverPlacement: AmbikiPopoverElement['placement'] = 'middle';
// @ts-expect-error: not a fallback strategy
export const notAFallbackStrategy: AmbikiAnchorElement['fallbackStrategy'] = 'nearest';

// The hook still takes everything Floating UI's `ReferenceElement` does: a Floating UI `VirtualElement`, and a virtual
// element with `getClientRects` (which Floating UI's `inline()` middleware reads).
declare const virtualElement: VirtualElement;
const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
export const anchorFromVirtualElement: UseFloatingUIOptions['anchorElement'] = virtualElement;
export const anchorWithClientRects: UseFloatingUIOptions['anchorElement'] = {
  getBoundingClientRect: () => rect,
  getClientRects: () => [rect],
};
