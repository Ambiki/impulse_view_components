// The `hooks` import path (see docs/adr/0008-one-import-path-per-thing.md): every hook by name, and every type their
// APIs mention.
export { default as useFloatingUI } from './use_floating_ui';
export type { UseFloatingUIOptions, UseFloatingUIType } from './use_floating_ui';
export { default as useFocusOut } from './use_focus_out';
export type { UseFocusOutOptions } from './use_focus_out';
export { default as useOutsideClick } from './use_outside_click';
export type { Boundary, UseOutsideClickOptions } from './use_outside_click';
export type { Anchor, AnchorRect, Dimension, DimensionOrBoth, Placement, Side, Strategy, VirtualAnchor } from 'src/internal/positioning';
