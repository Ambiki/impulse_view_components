import { FocusableElement, isFocusable, isTabbable, tabbable } from 'tabbable';

interface TrapMetadata {
  container: HTMLElement;
  // The controller that, when aborted, removes the focus listener for this trap. Aborting it does
  // not tear the trap down (sentinels/observer remain) so the trap can be reactivated later.
  controller: AbortController;
  initialFocus?: FocusableElement;
  // The signal that, when aborted, tears the trap down completely.
  originalSignal: AbortSignal;
}

// Only one trap enforces focus at a time. Activating a new trap suspends the current one; the
// suspended trap is reactivated when the trap on top of it is released.
const suspendedTrapStack: TrapMetadata[] = [];
let activeTrap: TrapMetadata | undefined;

// Visually hidden styles. Keeping the sentinels off-screen (rather than `display: none`) ensures
// they remain focusable while never affecting layout.
const SR_ONLY_STYLES =
  'position:fixed;width:1px;height:0;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

export default function focusTrap(
  container: HTMLElement,
  { abortSignal, initialFocus }: { abortSignal?: AbortSignal; initialFocus?: FocusableElement } = {}
): AbortController | undefined {
  // Set up an abort controller if a signal was not passed in.
  const controller = new AbortController();
  const signal = abortSignal || controller.signal;

  // The element to focus when the trap is activated. Honors the `data-autofocus` attribute.
  const resolvedInitialFocus = initialFocus || getInitialFocus(container);

  container.setAttribute('data-focus-trap', 'active');

  const sentinelStart = createSentinel(() => tryFocus(getLastTabbable(container)));
  const sentinelEnd = createSentinel(() => tryFocus(getFirstTabbable(container)));

  // If the container is being reactivated it may already have its sentinels. The mutation observer
  // keeps them pinned to the edges, so we only insert them on the first activation.
  const hasExistingSentinels = container.querySelector(':scope > span.sentinel') !== null;
  if (!hasExistingSentinels) {
    container.prepend(sentinelStart);
    container.append(sentinelEnd);
  }

  const observer = observeFocusTrap(container, [sentinelStart, sentinelEnd]);

  let lastFocusedChild: HTMLElement | undefined;

  // Ensure focus remains inside the container. If the focused element is outside, redirect focus to
  // the most recently focused child, the initial focus target, or the first focusable child.
  function ensureTrapZoneHasFocus(focused: EventTarget | null) {
    if (!(focused instanceof HTMLElement) || !document.contains(container)) return;

    if (container.contains(focused)) {
      lastFocusedChild = focused;
      return;
    }

    if (lastFocusedChild && isTabbable(lastFocusedChild) && container.contains(lastFocusedChild)) {
      tryFocus(lastFocusedChild);
    } else if (resolvedInitialFocus && container.contains(resolvedInitialFocus)) {
      tryFocus(resolvedInitialFocus);
    } else {
      tryFocus(getFirstTabbable(container));
    }
  }

  const wrappingController = followSignal(signal);

  // Suspend the currently active trap, if any. We abort its `controller` (removing its focus
  // listener) but leave it otherwise intact so it can be reactivated.
  if (activeTrap) {
    const suspendedTrap = activeTrap;
    suspendedTrap.container.setAttribute('data-focus-trap', 'suspended');
    suspendedTrap.controller.abort();
    suspendedTrapStack.push(suspendedTrap);
  }

  // Fires when this trap is suspended or fully released.
  wrappingController.signal.addEventListener('abort', () => {
    activeTrap = undefined;
  });

  // Fires only when the trap is fully released (user-initiated abort).
  signal.addEventListener('abort', () => {
    container.removeAttribute('data-focus-trap');
    container.querySelectorAll(':scope > span.sentinel').forEach((sentinel) => sentinel.remove());
    const index = suspendedTrapStack.findIndex((trap) => trap.container === container);
    if (index >= 0) suspendedTrapStack.splice(index, 1);
    observer.disconnect();
    tryReactivate();
  });

  // Focus events do not bubble, so we listen in the capture phase to catch them all.
  document.addEventListener('focus', (event) => ensureTrapZoneHasFocus(event.target), {
    signal: wrappingController.signal,
    capture: true,
  });

  // Focus the initial element.
  ensureTrapZoneHasFocus(document.activeElement);

  activeTrap = {
    container,
    controller: wrappingController,
    initialFocus: resolvedInitialFocus,
    originalSignal: signal,
  };

  // If we are reactivating a previously suspended trap, remove it from the suspended list.
  const suspendedIndex = suspendedTrapStack.findIndex((trap) => trap.container === container);
  if (suspendedIndex >= 0) suspendedTrapStack.splice(suspendedIndex, 1);

  if (!abortSignal) return controller;
}

function tryReactivate() {
  const trap = suspendedTrapStack.pop();
  if (trap) {
    focusTrap(trap.container, { abortSignal: trap.originalSignal, initialFocus: trap.initialFocus });
  }
}

// Bridges an external signal to an internal controller so we can abort independently of the
// external signal (used to suspend a trap without tearing it down).
function followSignal(signal: AbortSignal): AbortController {
  const controller = new AbortController();
  signal.addEventListener('abort', () => controller.abort());
  return controller;
}

// Keeps the sentinels pinned as the first and last children of the container when its contents
// change, so tabbing past the edges always lands on a sentinel.
function observeFocusTrap(container: HTMLElement, [sentinelStart, sentinelEnd]: [HTMLElement, HTMLElement]) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) continue;

      // Ignore our own sentinel insertions to avoid an infinite loop.
      for (const node of mutation.addedNodes) {
        if (isSentinel(node)) return;
      }

      if (!isSentinel(container.firstElementChild)) {
        container.insertAdjacentElement('afterbegin', sentinelStart);
      }
      if (!isSentinel(container.lastElementChild)) {
        container.insertAdjacentElement('beforeend', sentinelEnd);
      }
    }
  });

  observer.observe(container, { childList: true });
  return observer;
}

function createSentinel(onFocus: () => void): HTMLSpanElement {
  const sentinel = document.createElement('span');
  sentinel.className = 'sentinel';
  sentinel.setAttribute('tabindex', '0');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = SR_ONLY_STYLES;
  sentinel.onfocus = onFocus;
  return sentinel;
}

function isSentinel(node: Node | null): node is HTMLElement {
  return node instanceof HTMLElement && node.tagName === 'SPAN' && node.classList.contains('sentinel');
}

function getInitialFocus(container: HTMLElement): FocusableElement | undefined {
  const autofocus = container.querySelector<HTMLElement>('[data-autofocus]');
  if (autofocus && isFocusable(autofocus)) return autofocus;
  return getFirstTabbable(container);
}

// `tabbable` is unaware of our sentinels (which carry `tabindex="0"`), so we exclude them here.
function getTabbableChildren(container: HTMLElement) {
  return tabbable(container).filter((element) => !isSentinel(element));
}

function getFirstTabbable(container: HTMLElement): FocusableElement | undefined {
  return getTabbableChildren(container)[0];
}

function getLastTabbable(container: HTMLElement): FocusableElement | undefined {
  const elements = getTabbableChildren(container);
  return elements[elements.length - 1];
}

function tryFocus(element: HTMLElement | FocusableElement | null | undefined) {
  if (!element || element === document.activeElement) return;
  element.focus({ preventScroll: true });
}
