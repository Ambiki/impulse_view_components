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

### Events

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
