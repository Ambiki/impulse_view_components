---
status: accepted
---

# The combobox knows the active option, not the selection

`<awc-autocomplete>` was built on `@ambiki/combobox`, which moved the active option, committed it, and also kept
`aria-selected` for a single or a multiple select. The elements we mean to build next, such as mentions and a search
field, have an active option and a commit but no selected option: a commit inserts text, or follows a link. The
autocomplete didn't trust the package's selection either. Its value lives in its hidden fields, and it marked the
options again each time the listbox opened. We replace the package with our own combobox, `src/internal/combobox.ts`,
that knows only the active option and the commit. Selection, values, filtering and whether the list is showing belong to
the element built on it.

The combobox takes an input and a list. Between `start()` and `stop()` it moves the active option with the arrow keys
and the pointer, and calls `onCommit(option, event)` when the user commits one. It changes nothing on a commit.

## Considered Options

- **Keep `@ambiki/combobox`, and ignore its selection where there is none.** Rejected: it put `aria-multiselectable` on
  the input, where it isn't allowed, committed by dispatching a bubbling `combobox:commit` event that every element had
  to stop, took only an `<input>`, and took Home and End from the text.
- **Selection as an option of the combobox**, off for mentions and search. Rejected: the autocomplete would still own
  the value and mark the options from it, so the combobox's selection would stay a second copy.
- **A commit event instead of a callback.** Rejected: the combobox isn't an element, so its event would travel through
  the element's own markup and out of it, and reach a combobox it is nested in.
- **A base element class**, as `OpenableElement` is. Rejected: the autocomplete already extends that one, and a list
  that is always showing, such as a command palette's, has no open state to share.
- **Export it from `/helpers` now.** Rejected: it would freeze an API only one element has used. It can be exported
  once a second element is built on it.

## Consequences

- The select variants are the only code that writes `aria-selected`, and the multiple select puts
  `aria-multiselectable` on the listbox.
- A keyboard commit no longer clicks the option, so click listeners on an option hear only real clicks.
- Home and End move the caret in the input, as the APG asks of an editable combobox, and leave no option active. They
  used to move to the first and last option.
- Enter with no active option is left to the input: it submits the form, or breaks the line in a `<textarea>`. The
  autocomplete still keeps Enter from submitting its form while it is open.
- Tab commits only when the element asks for it with `tabCommits`, as the autocomplete does.
- The combobox never activates an option on its own. The element chooses the active option when its list opens and
  when its options change.
- A disabled option can be active but can't be committed, as before.
- An option needs no `tabindex`, and takes an `id` when it is first activated, so options added later need no
  initializing.
- `autocomplete.combobox` is internal. It was public but undocumented, and its `select`, `deselect`, `deselectAll`,
  `isSelected` and `initializeOptions` are gone.
- Markup that isn't rendered by `Impulse::AutocompleteComponent` drops `combobox:commit->awc-autocomplete#handleCommit`
  from the element's `data-action`. Left in, it does nothing.
