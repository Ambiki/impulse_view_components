---
status: accepted
---

# The autocomplete's selection pairs each value with its text

`<awc-autocomplete>`'s `value` gives the selected values, and nothing public gave their text, so the main app read
`data-text` off the hidden fields, which are private markup. An ajax select has no options until it searches, so the
hidden fields are the only place the text is. We add a read-only `selection`, which pairs each value with its text,
`{ value, text }`, and is typed by the selection mode as `value` is: a multiple select gives an array in the order of
`value`, and a single select gives one pair, or `null` when nothing is selected. It reads the same hidden fields as
`value`, so the two can't disagree.

## Considered Options

- **A `text` that mirrors `value`**, a `string` or a `string[]` in the same order, as #457 first proposed. Rejected: the
  caller pairs each value with its text by position, and code that keeps both, such as a snapshot, pairs them itself.
- **`selectedText`.** Rejected for the same reason, and it has no `selectedValue` to pair with.
- **Always an array**, as native `selectedOptions` is a collection whatever `multiple` is. Rejected: `value` already
  departs from the native `select.value` and is typed by the selection mode, and the selection follows it, so a caller
  narrows on `multiple` once for both.
- **The option elements**, as `selectedOptions` gives them. Rejected: an ajax select keeps a value no option on the
  page offers.

## Consequences

- An empty single select gives `null`, where `value` gives `''`: no value is no selection, whatever text an option
  with an empty value has, as `followOptions` already rules.
- `selection` reads the markup before the element has connected, as `value` does, so the two agree there too.
- It is read-only. Writing goes through `setValue`, `removeValue` and `clear`. A selected value can't be given new text
  in an ajax multiple select, where `setValue` ignores a value that is selected already.
- Each read gives new objects, as a multiple select's `value` gives a new array. Changing them changes nothing.
- The types are exported as `AutocompleteSelection<Mode>` and `AutocompleteSelectedValue`.
