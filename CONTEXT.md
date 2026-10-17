# Impulse View Components

Server-rendered ViewComponents paired with Web Components for interactive UI patterns (popovers, autocompletes, dialogs, selects).

## Language

### Floating UI

**Trigger**:
The element whose interaction opens or closes a floating element.
_Avoid_: Button, toggle

**Anchor**:
The element a floating element is positioned against. Defaults to the trigger, but may differ (an autocomplete's whole control, a context menu's pointer position).
_Avoid_: Reference, reference element, target

**Floating element**:
The element positioned relative to an anchor and kept inside the viewport.
_Avoid_: Popup, panel, content

### Focus

**Focus return**:
Moving focus back to where an element was opened from, such as its trigger, when it closes while focus is inside it or lost.
_Avoid_: Focus restore, refocus, final focus

### Combobox

**Active option**:
The option the user has moved to, by keyboard or pointer, that a commit would choose. Distinct from a selected option.
_Avoid_: Highlighted option, focused option, current option

**Commit**:
The user choosing the active option, by Enter, Tab or a click. What it does to the selection is decided by the element built on the combobox.
_Avoid_: Pick, choose, submit

**Selected option**:
An option whose value is part of the element's value.
_Avoid_: Chosen option, checked option

**Deselect**:
Taking an option's value out of the element's value, by committing it again in a multiple select or by removing its tag.
_Avoid_: Unselect

### Events

**Open**:
The state of an element that is showing its floating element or dialog, recorded by its `open` attribute.
_Avoid_: Shown, visible, expanded

**Request**:
An attempt to open or close an element that listeners may refuse, made by a user action or a `request*` call.
_Avoid_: Intent, user action

**Request event**:
The cancelable event a request emits before the element opens or closes (`show`, `hide`).
_Avoid_: Before event, intent event

**State event**:
The event emitted after an element has opened or closed, whatever caused it (`shown`, `hidden`).
_Avoid_: After event, notification, lifecycle event

**Value event**:
The event emitted after the user changes an element's value, or its form resets (`commit`, `remove`, `clear`, `reset`).
_Avoid_: Change event
