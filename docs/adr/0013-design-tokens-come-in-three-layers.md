---
status: accepted
---

# Design tokens come in three layers

The styles read a mix of Bootstrap's Sass variables, hex values and unprefixed custom properties such as `--white` and `--rounded-sm`. An app couldn't theme a component without knowing which one it used, and our `:root` names could clash with the app's own. We name every token after [Radix's aliasing](https://www.radix-ui.com/colors/docs/overview/aliasing), in three layers, all prefixed `--awc-`:

1. **Scales.** `--awc-gray-1` to `--awc-gray-12`, `--awc-blue-*`, `--awc-green-*`, `--awc-yellow-*` and `--awc-red-*`: the palette the components already used, placed on Radix's 12 steps. A step the palette has no color for is left out. Sizes are numbered too: `--awc-space-*`, `--awc-radius-*`, `--awc-font-size-*` and `--awc-shadow-*`.
2. **Aliases.** `--awc-{neutral|accent|success|warning|danger}-{use}`, where the use is Radix's name for the step: `bg-subtle` (2), `bg` (3), `line` (6), `border` (7), `solid` (9), `text` (11), `text-contrast` (12) and so on. A use whose step is left out takes the nearest step. Surfaces have their own: `--awc-panel`, `--awc-overlay` and `--awc-focus-ring`.
3. **Component tokens.** `--awc-{component}-{part}-{property}[-{state|size}]`, such as `--awc-popover-max-width` or `--awc-autocomplete-option-bg-hover`. Colors are `bg`, `text` and `border`. Other properties keep their CSS name in full: `font-weight`, not `fw`.

Every token is declared on `:where(:root)`, which has no specificity, so an app overrides one from any selector and in any order. Component rules read aliases and component tokens only: never a scale step, a hex value or Bootstrap's Sass.

Bootstrap's Sass seeds a token only where the markup is Bootstrap's own: the autocomplete's `.form-control` and `.dropdown-item`s, the focus ring, the base font, and the popover's arrow, which Bootstrap's CSS draws. Our own components take their own values, so `$popover-max-width` and `$modal-dialog-margin` no longer change them. Media queries can't read custom properties, so the dialog's breakpoints still come from `$grid-breakpoints`.

## Considered Options

- **Adopt Radix Colors' scales.** Rejected for now: it changes how every component looks. A scale can be swapped later without renaming an alias.
- **Hardcode Bootstrap 4's defaults.** Rejected: apps change Bootstrap's input and font variables, and the autocomplete has to match their `.form-control`.
- **Leave component tokens undeclared, with the default as each `var()`'s fallback.** Rejected: an app couldn't read them, and the autocomplete's were already declared.
- **Declare tokens on `:root`.** Rejected: an app's `:root` override would win only if it loaded after our styles.
- **Rename the old names outright.** Rejected: they're public, and we ship no breaking changes.

## Consequences

- The old names stay until 1.0: `--white`, `--n300`, `--color-*`, `--rounded-*`, `--fs-*`, `--fw-*`, `--shadow-*`, `--space-*`, and the autocomplete's names that end in `-color`, `-lh` or `-fw`. Each new token reads its old name, so an app that sets or reads one keeps working. At 1.0 the old names go and their values move onto the new tokens.
- Borders moved from `#d0d7de`, which isn't in the palette, to `--awc-gray-6` (`#d2daea`).
- `::backdrop` doesn't inherit custom properties before Chrome 122, Firefox 120 and Safari 17.4, so the dialog's backdrop repeats `--awc-overlay`'s value as its fallback.
