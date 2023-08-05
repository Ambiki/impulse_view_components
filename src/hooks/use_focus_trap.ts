import { tabbable, focusable, FocusableElement, isFocusable } from 'tabbable';

const trappedContainers: Set<HTMLElement> = new Set();

export type UseFocusTrap = {
  start: () => void;
  stop: () => void;
};

export default function useFocusTrap(container: HTMLElement): UseFocusTrap {
  let focusedElementBeforeActivation: HTMLElement | null;
  let recentlyFocused: HTMLElement | FocusableElement | null;

  function handleFocusin(event: Event) {
    const target = (event.composedPath?.()?.[0] || event.target) as HTMLElement;

    for (const element of trappedContainers) {
      if (element.contains(target)) {
        recentlyFocused = target;
        return;
      }
    }

    tryFocus(recentlyFocused);
  }

  function start() {
    focusedElementBeforeActivation = document.activeElement as HTMLElement;
    trappedContainers.add(container);

    const tabbableElements = tabbable(container);

    const sentinelStart = document.createElement('span');
    sentinelStart.setAttribute('tabindex', '0');
    sentinelStart.setAttribute('aria-hidden', 'true');
    sentinelStart.setAttribute('data-sentinel', '');
    sentinelStart.classList.add('sentinel');
    sentinelStart.onfocus = () => {
      const lastFocusableElement = tabbableElements[tabbableElements.length - 1];
      lastFocusableElement?.focus();
    };

    const sentinelEnd = document.createElement('span');
    sentinelEnd.setAttribute('tabindex', '0');
    sentinelEnd.setAttribute('aria-hidden', 'true');
    sentinelEnd.setAttribute('data-sentinel', '');
    sentinelEnd.classList.add('sentinel');
    sentinelEnd.onfocus = () => {
      const firstFocusableElement = tabbableElements[0];
      firstFocusableElement?.focus();
    };

    insertBefore(sentinelStart, container);
    insertAfter(sentinelEnd, container);

    tryFocus(getFirstFocusableElement(container));

    document.addEventListener('focusin', handleFocusin, true);
  }

  function stop() {
    const sentinels = container.parentNode?.querySelectorAll('[data-sentinel]');
    sentinels?.forEach((sentinel) => sentinel.remove());

    trappedContainers.delete(container);
    document.removeEventListener('focusin', handleFocusin, true);
    tryFocus(focusedElementBeforeActivation);
    focusedElementBeforeActivation = null;
    recentlyFocused = null;
  }

  function getFirstFocusableElement(container: HTMLElement) {
    if (container.hasAttribute('data-autofocus') && isFocusable(container)) {
      return container;
    }

    const element = container.querySelector<HTMLElement>('[data-autofocus]');
    if (element && isFocusable(element)) {
      return element;
    }

    const focusableElements = focusable(container);
    if (focusableElements[0]) {
      return focusableElements[0];
    }

    if (isFocusable(container)) {
      return container;
    }
  }

  function tryFocus(element?: HTMLElement | FocusableElement | null) {
    if (!element) {
      tryFocus(container);
      return;
    }

    if (element === document.activeElement) return;
    element.focus({ preventScroll: true });
    recentlyFocused = element;
  }

  return { start, stop };
}

function insertBefore(newNode: HTMLElement, container: HTMLElement) {
  container.parentNode?.insertBefore(newNode, container);
}

function insertAfter(newNode: HTMLElement, container: HTMLElement) {
  container.parentNode?.insertBefore(newNode, container.nextSibling);
}
