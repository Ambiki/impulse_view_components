// A consumer-shaped fixture: every public subpath of the package, imported the way an
// application would import it (ADR 0008). Type-checked with `moduleResolution: bundler` and
// `node16`, both of which honour the `exports` map, so a subpath that stops resolving fails
// here with TS2307.
//
// Every import binds a name on purpose. TypeScript does not report TS2307 for side-effect
// imports (`import 'pkg/subpath';`), so a bare side-effect import would let a broken subpath
// through unnoticed.
//
// See `scripts/check-exports.mjs`.

/* eslint-disable perfectionist/sort-imports -- grouped by subpath */
import * as root from '@ambiki/impulse-view-components';

import * as anchor from '@ambiki/impulse-view-components/anchor';
import { AwcAnchorElement } from '@ambiki/impulse-view-components/anchor';
import type {
  Placement as AnchorPlacement,
  Side as AnchorSide,
  Strategy as AnchorStrategy,
  Dimension,
  DimensionOrBoth,
  FallbackStrategy,
} from '@ambiki/impulse-view-components/anchor';
import * as autocomplete from '@ambiki/impulse-view-components/autocomplete';
import { AwcAutocompleteElement } from '@ambiki/impulse-view-components/autocomplete';
import type { AwcAutocompleteCommitEvent } from '@ambiki/impulse-view-components/autocomplete';
import * as clipboardCopy from '@ambiki/impulse-view-components/clipboard-copy';
import { AwcClipboardCopyElement } from '@ambiki/impulse-view-components/clipboard-copy';
import type { AwcClipboardCopyCopiedEvent } from '@ambiki/impulse-view-components/clipboard-copy';
import * as dateCalendar from '@ambiki/impulse-view-components/date-calendar';
import { AwcDateCalendarElement } from '@ambiki/impulse-view-components/date-calendar';
import type { AwcDateCalendarCommitEvent } from '@ambiki/impulse-view-components/date-calendar';
import * as dialog from '@ambiki/impulse-view-components/dialog';
import { AwcDialogElement } from '@ambiki/impulse-view-components/dialog';
import * as popover from '@ambiki/impulse-view-components/popover';
import { AwcPopoverElement } from '@ambiki/impulse-view-components/popover';
import type {
  Placement as PopoverPlacement,
  Side as PopoverSide,
  Strategy as PopoverStrategy,
} from '@ambiki/impulse-view-components/popover';

import { useFloatingUI, useFocusOut, useOutsideClick } from '@ambiki/impulse-view-components/hooks';
import type {
  Anchor,
  AnchorRect,
  Boundary,
  Dimension as HookDimension,
  DimensionOrBoth as HookDimensionOrBoth,
  Placement as HookPlacement,
  Side as HookSide,
  Strategy as HookStrategy,
  UseFloatingUIOptions,
  UseFloatingUIType,
  UseFocusOutOptions,
  UseOutsideClickOptions,
  VirtualAnchor,
} from '@ambiki/impulse-view-components/hooks';

import type { VirtualElement } from '@floating-ui/dom';

export const used = {
  root,
  anchor,
  autocomplete,
  clipboardCopy,
  dateCalendar,
  dialog,
  popover,
  useFloatingUI,
  useFocusOut,
  useOutsideClick,
};

// Positioning types must reach the consumer as their real unions. A declaration that imports them through a path the
// consumer can't resolve degrades them to `any` without an error, because library checks are skipped; each
// `@ts-expect-error` below then has nothing to suppress and fails instead.
// @ts-expect-error: not a placement
export const notAPlacement: UseFloatingUIOptions['placement'] = 'middle';
// @ts-expect-error: not a placement
export const notAPopoverPlacement: AwcPopoverElement['placement'] = 'middle';
// @ts-expect-error: not a fallback strategy
export const notAFallbackStrategy: AwcAnchorElement['fallbackStrategy'] = 'nearest';
// @ts-expect-error: an event's `value` is a string
export const notACommitValue: AwcAutocompleteCommitEvent['value'] = 1;
// @ts-expect-error: an event's `selected` is a boolean
export const notACommitSelected: AwcAutocompleteCommitEvent['selected'] = 'true';
// @ts-expect-error: the copied text is a string
export const notACopiedText: AwcClipboardCopyCopiedEvent['text'] = 1;
// @ts-expect-error: the value to copy is a string
export const notAClipboardValue: AwcClipboardCopyElement['value'] = 1;
// @ts-expect-error: the copy source is named by its id, a string
export const notAClipboardFor: AwcClipboardCopyElement['for'] = 1;
// `copy()` is public and resolves to nothing.
export const copied: Promise<void> = document.createElement('awc-clipboard-copy').copy();
// Listeners get the clipboard copy's events typed, without a cast.
document.addEventListener('awc-clipboard-copy:copied', (event) => {
  const text: string = event.detail.text;
  return text;
});
document.addEventListener('awc-clipboard-copy:error', (event) => {
  const reason: unknown = event.detail.error;
  return reason;
});
// @ts-expect-error: a committed day is a `YYYY-MM-DD` string
export const notACommittedDay: AwcDateCalendarCommitEvent['value'] = new Date();
// @ts-expect-error: the disabled days of the week are numbers
export const notDisabledDays: AwcDateCalendarElement['disabledDaysOfWeek'] = ['sunday'];
// `resetView()`, `previousPage()`, `nextPage()`, `goToDate()` and `focus()` are public and return nothing.
const calendar = document.createElement('awc-date-calendar');
export const reset: void = calendar.resetView();
export const paged: [void, void] = [calendar.previousPage(), calendar.nextPage()];
export const wentToDate: void = calendar.goToDate('2026-12-24');
// @ts-expect-error: a day to go to is a `YYYY-MM-DD` string
export const notADayToGoTo: void = calendar.goToDate(new Date());
export const focused: void = calendar.focus();
// Listeners get the date calendar's event typed, without a cast.
document.addEventListener('awc-date-calendar:commit', (event) => {
  const value: string = event.detail.value;
  return value;
});

// The hook still takes everything Floating UI's `ReferenceElement` does: a Floating UI `VirtualElement`, and a virtual
// element with `getClientRects` (which Floating UI's `inline()` middleware reads).
declare const virtualElement: VirtualElement;
const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
export const anchorFromVirtualElement: UseFloatingUIOptions['anchorElement'] = virtualElement;
export const anchorWithClientRects: UseFloatingUIOptions['anchorElement'] = {
  getBoundingClientRect: () => rect,
  getClientRects: () => [rect],
};

// Each element path exports its class by name, alongside the default export.
export const namedClasses: [
  typeof anchor.default,
  typeof autocomplete.default,
  typeof clipboardCopy.default,
  typeof dateCalendar.default,
  typeof dialog.default,
  typeof popover.default,
] = [
  AwcAnchorElement,
  AwcAutocompleteElement,
  AwcClipboardCopyElement,
  AwcDateCalendarElement,
  AwcDialogElement,
  AwcPopoverElement,
];
// @ts-expect-error: a plain element is not an anchor
export const notAnAnchorElement: AwcAnchorElement = document.createElement('div');
// @ts-expect-error: a plain element is not an autocomplete
export const notAnAutocomplete: AwcAutocompleteElement = document.createElement('div');
// @ts-expect-error: a plain element is not a clipboard copy
export const notAClipboardCopy: AwcClipboardCopyElement = document.createElement('div');
// @ts-expect-error: a plain element is not a date calendar
export const notADateCalendar: AwcDateCalendarElement = document.createElement('div');
// @ts-expect-error: a plain element is not a dialog
export const notADialog: AwcDialogElement = document.createElement('div');
// @ts-expect-error: a plain element is not a popover
export const notAPopover: AwcPopoverElement = document.createElement('div');

// ...and the positioning types its properties use, as their real unions.
// @ts-expect-error: not a placement
export const notAnAnchorPlacement: AnchorPlacement = 'middle';
// @ts-expect-error: not a side
export const notAnAnchorSide: AnchorSide = 'middle';
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
// @ts-expect-error: not a side
export const notAPopoverSide: PopoverSide = 'middle';
// @ts-expect-error: not a strategy
export const notAPopoverStrategy: PopoverStrategy = 'sticky';

// The hooks path exports every type the hooks' APIs mention, as their real types.
// @ts-expect-error: not a placement
export const notAHookPlacement: HookPlacement = 'middle';
// @ts-expect-error: not a side
export const notAHookSide: HookSide = 'middle';
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
export const notFloatingUIOptions: UseFloatingUIOptions = {};
// @ts-expect-error: a hook's controls are functions
export const notFloatingUIControls: UseFloatingUIType = { start: true, update: true, stop: true };
// @ts-expect-error: focus-out options need boundaries and a callback
export const notFocusOutOptions: UseFocusOutOptions = {};
// @ts-expect-error: outside-click options need boundaries and a callback
export const notOutsideClickOptions: UseOutsideClickOptions = {};
