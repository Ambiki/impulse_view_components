---
status: accepted
---

# The combobox is a public part of IVC and leaves selection to the element built on it

`<awc-autocomplete>` was built on `@ambiki/combobox`, a standalone package documented on its own site, which apps also used directly to build their own comboboxes, such as a command palette. Developers had to read two sets of docs for one widget. We move the combobox into IVC as a public, documented class, `@ambiki/impulse-view-components/dist/combobox`, rather than an internal module or a separate package.

We also take selection away from it. The package toggled `aria-selected` on the option it committed, and then the autocomplete toggled its own copy of the selection, so two owners agreed only as long as they started from the same state. The combobox now handles the active option, keyboard and pointer movement, and emits `combobox:commit`; the element built on it decides what a commit does and marks options with `aria-selected`, and the list with `aria-multiselectable`. A command palette, which has no selection, is unaffected.

## Considered Options

- **Keep it internal** (`src/internal/`), not exported. Rejected: apps building their own comboboxes would keep reading the package's docs, which is the problem.
- **A hook** (`useCombobox`), like `useFloatingUI`. Rejected: a combobox starts and stops with its list opening and closing, not with an element connecting, and a hook would require an `@ambiki/impulse` element where any custom element works today.
- **Port it as it was**, selection included. Rejected: the API is frozen once public, so the two owners of the selection would be frozen with it.

## Consequences

- The `combobox:commit` event keeps its name, since the autocomplete's markup wires it.
- `multiple`, `select()`, `deselect()`, `deselectAll()` and `isSelected()` are gone, and `start()` and `stop()` no longer touch `aria-selected`.
- `aria-multiselectable` moves from the input to the listbox, where WAI-ARIA defines it.
- `<awc-autocomplete>`'s `combobox` field exposed the package's class, selection methods included. It is marked private and loses them, accepted as a one-off breaking change despite the frozen API.
- `@ambiki/combobox` 2.x diverges from it; IVC no longer depends on the package.
