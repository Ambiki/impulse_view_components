---
status: accepted
---

# One internal positioning engine behind `useFloatingUI` and `<awc-anchor>`

IVC has two public ways to position a floating element against an anchor: the `useFloatingUI` hook, for authors of Impulse elements, and `<awc-anchor>` / `Impulse::AnchorComponent`, for authors writing markup. Each carried its own copy of the Floating UI logic, and the copies drifted (`autoSize` only in the hook, fallback/padding knobs only in the element, different placement and `shift` defaults). We keep both as first-class public faces, rebuild both on a single internal positioning engine, route IVC's own components through the hook, and keep Floating UI as the only backend behind an engine interface that exposes no Floating UI concepts.

## Considered Options

- **Deprecate one face.** Rejected: both are published API consumed by apps outside this repo, and we ship no breaking changes.
- **Build `<awc-anchor>` on the hook.** Rejected: the hook captured its options once at construction, while the element needs attribute changes to take effect live.
- **Build IVC components on `<awc-anchor>` in their templates.** Rejected: it adds a wrapper element, moves start/stop into an `active` attribute, and fights floating elements that live in the top layer.
- **Have IVC components call the engine directly.** Rejected: neither public face would be exercised by real use. That is how the hook's `middleware` option stayed silently broken.
- **Adopt CSS anchor positioning now.** Rejected for now: it only reached Baseline "newly available" in January 2026 (Firefox 147), cross-shadow-DOM support is mixed, and frozen public behaviour depends on JS-computed output that CSS cannot report back: the `x-placement` attribute, the `--awc-auto-size-*` custom properties, custom `middleware`, and arrow offsets.

## Consequences

- The engine has its own option vocabulary plus a `floatingUI` passthrough (offset, flip, shift, middleware) that only the Floating UI backend honours. Using the passthrough, or anchoring to a virtual element such as a pointer position, pins that floating element to Floating UI.
- The engine owns one set of defaults that both faces share: `bottom` placement, `fixed` strategy, flip on, shift on, and zero for every offset and padding. The faces had drifted apart by accident (the hook defaulted to `bottom-start`, the element did not shift), so aligning them was accepted as a one-off breaking change despite the frozen API.
- The engine reads its options at every reposition. The hook accepts either an options object or a function returning one.
- `<awc-anchor>` exposes every engine option that can be expressed as an attribute. Function-valued options (`middleware`, virtual anchors) stay hook-only.
- Revisit a CSS anchor positioning backend once it is Baseline "widely available", for floating elements that need no arrow, no `x-placement`, and no passthrough.
