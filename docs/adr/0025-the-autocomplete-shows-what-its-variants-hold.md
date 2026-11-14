---
status: accepted, superseded in part by ADR 0026
---

# The autocomplete shows what its variants hold

`<awc-autocomplete>` has two pairs of variants: a select variant, single or multiple, and a search variant, local or
ajax. Each was handed the whole element and wrote to it. The select variants set the input's text, the selected class,
the options' `aria-selected` and the active option. The search variants activated options, checked for an empty list
and, for ajax, started the select variant. The element kept five members public for them, four modules decided the
active option, and the listbox only opened right when the select variant started before the search variant. We make
each variant say what it holds, and nothing more. A select variant is the selection mode: it keeps the selection in its
hidden fields and tags, and answers what its mode decides. A search variant is where the options come from. The element
alone decides what the listbox shows of either: the selected options, the active option, the empty state and where the
listbox sits. ADR 0024 draws the same line between the combobox and the element.

## Considered Options

- **The same roles behind a typed interface**: the variants keep writing to the element, through a narrow type in
  place of the whole element. Rejected: the members would still exist, as an interface, and the active option and the
  order the variants start in would stay spread out.
- **Fold the variants into the element**, branching on `multiple` and `src`. Rejected: single and multiple, and local
  and ajax, each differ in earnest, and one file would hold all four.
- **Mode rules as branches in the element**: `if (this.multiple)` where a commit closes the listbox, where the input
  takes its text and where it is required. Rejected: a mode's rules would be split between its variant and the element,
  and would follow the `multiple` attribute while the variant, chosen as the element connects, doesn't.
- **The element owning the ajax request's attributes and events**, from states the ajax search reports. Rejected: only
  the ajax search knows when a request starts, is superseded, aborted or fails, and the rules that pair `loadstart`
  with `loadend` would move with the states.
- **A promise from `search()`, or the element watching its options**, in place of a callback. Rejected: with a
  promise, the element would have to tell a superseded or aborted request from a finished one. Watching runs a
  microtask late, and filtering only changes `hidden`.

## Consequences

- A select variant is given the element only as the place to find its hidden fields, tags and tag template. It answers
  three things for its mode: whether a commit closes the listbox, the text the input shows for the selection, and
  whether the input is required. It also says which options are selected.
- A search variant is given a callback to call once the options on show have changed, and says whether a query is
  still waiting for its options. The ajax search still sets `loading` and `error`, and emits `loadstart`, `load`,
  `error` and `loadend`.
- The element runs one sequence when the listbox opens, a query filters the options or a response replaces them: it
  marks the selected options, activates one, says whether the list is empty and, after a response, repositions the
  listbox. Nothing depends on the order the variants start in.
- The element, not its select variants, writes the options' `aria-selected`, which supersedes that part of ADR 0024.
- The active option is decided in one place, and the rule isn't uniform yet. It is the first selected option, or else
  the first option, when the listbox opens and when a response arrives, and the first match after a query filters
  options on the page. No option is active while a query waits for its options.
- The element still handles a multiple select's tags itself: Backspace removes the last one, and a dismiss button its
  own.
- `combobox`, `selectVariant`, `markSelected` and `tags` are private, and `checkIfListIsEmpty` and
  `toggleSelectedClass` are gone. All six were public, though undocumented, and only the element used `tags`.
- The variants have no tests of their own. They are tested through the element, so that no test holds the line
  between them in place while it is new.
