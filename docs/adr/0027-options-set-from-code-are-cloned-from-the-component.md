---
status: accepted
---

# Options set from code are cloned from the component

An app could only change a local select's options by writing into `optionsContainer`, a private target, and by copying
the option markup by hand: its classes, its text and description, its check icon and its ids. The main app does this in
six places. We add `setOptions` and `addOption`, which take data, `{ value, text, description?, disabled? }`, and build
each option from a `<template>` that `AutocompleteComponent` renders in every local select, holding an
`OptionComponent`. The option's markup stays in one language, Ruby, as a multiple select's tags already do with their
tag template (#172).

## Considered Options

- **The element builds the markup in TypeScript.** Rejected: the option would be defined twice, in Ruby and in
  TypeScript, the drift ADR 0006 avoided for defaults. The markup check from #455 compares targets, behaviors and roles,
  not the classes the styles depend on.
- **The app passes option elements.** Rejected: the app would still copy the markup by hand, which is what the methods
  are for.
- **Render the template only when a Ruby setting asks for it.** Rejected: a forgotten setting fails only once the
  method is called, and the template adds a few hundred bytes.

## Consequences

- Every local select carries the option template. An ajax select doesn't: its options can't be set from code, as the
  next response would replace them.
- Markup written by hand needs the template too. Without it, `setOptions` and `addOption` throw and name it.
- The template's option is rendered with a blank value, text and description. The element fills in the value,
  `data-text`, the text, the description, which it drops when there is none, and whether the option is disabled. It
  finds the text and the description by their `data-behavior`, which every option now renders. It gives the text a new
  id, so `aria-labelledby` points to the copy, and drops the template's id from the option, which the combobox gives one
  when it first activates it.
- Options set from code are local options. A DOM morph puts the server's options back.
- The selection follows the options set from code: a value no option offers any longer is deselected, and one an
  option still offers takes its text. Nothing is selected in place of a value that goes, where a native single
  `<select>` selects its first option, as an autocomplete can have no value. A form reset brings back only the values
  an option offers.
