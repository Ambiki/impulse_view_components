---
status: accepted
---

# Element defaults live only in JavaScript

A page morph syncs a live element's attributes to the server HTML, so it stripped the defaults `@ambiki/impulse` wrote into attributes when an element connected (#319). The proposed fix was for each Ruby component to render every default its element declares. We fix it in impulse instead (Ambiki/impulse#229): a missing attribute reads as the property's default, which lives only in the element's JavaScript and is never written to the DOM, as Stimulus does for its values. A Ruby component doesn't render an attribute just to restate its element's default.

## Considered Options

- **Render the defaults from Ruby.** Rejected: each default would be defined in two languages, the kind of drift ADR 0001 removed for the positioning defaults, and `<awc-*>` markup written by hand would still lose them.
- **Cancel `turbo:before-morph-attribute` for defaulted attributes.** Rejected: it works only with Turbo, and when the server drops `placement="top"` to fall back to the default, the attribute is removed and nothing restores the default.

## Consequences

- A connected element no longer shows its defaults as attributes, so a selector like `awc-popover[placement="bottom"]` stops matching. Read the property, or render the attribute explicitly. Accepted as a one-off breaking change.
- Turning off a Boolean that defaults to `true` writes `="false"`, as `auto_size: false` already renders. Removing its attribute turns it back on.
- Each element's tests morph it with `idiomorph` and check that its defaults survive.
