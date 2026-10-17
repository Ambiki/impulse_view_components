/**
 * Teardown for hooks: `onDisconnect` runs a cleanup the next time an element disconnects. It is internal: the package's
 * `exports` map doesn't list it. The hooks that use it are public, though, so their behaviour on reconnect reaches apps.
 *
 * A hook called from `connected()` used to wrap the element's `disconnected` itself. An element connects again every
 * time it's moved, so each move added a wrapper, each holding on to the cleanup, and what it closes over, of a
 * connection long gone (#284). The element's `disconnected` is now wrapped once, and the wrapper runs whatever has been
 * registered since the last disconnect.
 */
import type { ImpulseElement } from '@ambiki/impulse';

const cleanups = new WeakMap<ImpulseElement, Array<() => void>>();

/**
 * Runs `cleanup` the next time `element` disconnects, before the element's own `disconnected`. Cleanups run newest
 * first, as nested wrappers would.
 */
export default function onDisconnect(element: ImpulseElement, cleanup: () => void) {
  let registered = cleanups.get(element);
  if (!registered) {
    registered = [];
    cleanups.set(element, registered);
    wrapDisconnected(element, registered);
  }
  registered.push(cleanup);
}

function wrapDisconnected(element: ImpulseElement, registered: Array<() => void>) {
  const disconnected = element.disconnected.bind(element);
  Object.assign(element, {
    disconnected() {
      // Emptied before any of them runs, so a cleanup that registers another leaves it for the next disconnect.
      for (const cleanup of registered.splice(0).reverse()) {
        cleanup();
      }
      disconnected();
    },
  });
}
