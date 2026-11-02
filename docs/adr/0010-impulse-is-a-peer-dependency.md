---
status: accepted
---

# Impulse is a peer dependency

Apps build their own elements on `@ambiki/impulse` and pass them to our hooks, so the app and the package must share one impulse. As a dependency, Yarn 1 installs a second copy whenever the app's range and ours resolve apart, even within a major. The two `ImpulseElement` classes then don't typecheck against each other, and both runtimes ship. We declare impulse as a peer dependency: the app installs it, and we use the app's copy.

## Considered Options

- **Keep it a dependency.** Rejected: duplicates are silent, and break the hooks' types.
- **Bundle impulse into the npm build.** Rejected: an app using impulse always gets two copies.
- **Leave impulse out of the gem's UMD bundle.** Rejected: apps would have to load impulse's own UMD first, for a case nobody has.

## Consequences

- Apps install `@ambiki/impulse` themselves. Yarn 1 only warns on a mismatched peer, so an app on an older major loads it anyway; our imports it lacks fail at build time or at runtime.
- Moving to a new impulse major means upgrading impulse and this package in the same change.
- The gem's UMD bundle still carries its own impulse.
- This is a one-off breaking change despite the frozen API.
