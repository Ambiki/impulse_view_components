---
status: accepted
---

# The first match is the active option once the user has typed

When `<awc-autocomplete>`'s listbox opens, the active option is the first selected option, or else the first option,
so that the user lands on what is selected. After that, it depended on where the options came from. A query that
filtered options on the page activated the first match. A response from the server activated the selected option when
it was among the results, and only otherwise the first. So Enter after typing committed the best match in a local
select, and could commit the option that was selected already in an ajax one. ADR 0025 put the rule in one place and
left it uneven. We make it one rule: from the first thing the user types until the listbox closes, the active option is
the first match, whatever is selected and wherever the options come from.

## Considered Options

- **The first match only while the input holds a query**, and the selected option again once the typed text is
  deleted. Rejected: a local select would change too, and the active option would jump back to the selected option,
  scrolling the list, as the user deletes the last letter.
- **The selected option whenever it matches**, in a local select too. Rejected: typing and pressing Enter would keep
  the option that is selected already, where the user typed to get the first match.
- **Leave the two as they were.** Rejected: nothing about where its options come from explains the difference to
  someone using a select.

## Consequences

- An ajax select activates the first option of every response once the user has typed, the response for text the user
  has deleted again included. It used to activate the selected option when the response had it.
- A local select doesn't change.
- Opening is as before, and a listbox that opens again starts over: the selected option is active until the user
  types.
- The selected options still say so with `aria-selected`, wherever the active option is.
- The element remembers that the user has typed, from an `input` event until the listbox next opens. A paste counts.
- This supersedes what ADR 0025 says of the active option.
