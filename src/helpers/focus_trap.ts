import { FocusableElement, focusable, isFocusable, tabbable } from 'tabbable';

const containerStack: Set<HTMLElement> = new Set();

export default function focusTrap(container: HTMLElement, { abortSignal }: { abortSignal?: AbortSignal } = {}) {
  const controller = new AbortController();
  const signal = abortSignal || controller.signal;

  let focusedElementBeforeActivation: HTMLElement | null = document.activeElement as HTMLElement;
  let recentlyFocused: HTMLElement | FocusableElement | null;

  // Ensure focus remains inside the container or inside one of the container stack.
  function handleFocusin(event: Event) {
    const target = (event.composedPath?.()?.[0] || event.target) as HTMLElement;

    for (const element of containerStack) {
      if (element.contains(target)) {
        recentlyFocused = target;
        return;
      }
    }

    tryFocus(recentlyFocused);
  }

  containerStack.add(container);

  const tabbableElements = tabbable(container).filter((element) => !element.hasAttribute('data-sentinel'));

  const sentinelStart = createSentinel();
  sentinelStart.onfocus = () => {
    const lastFocusableElement = tabbableElements[tabbableElements.length - 1] as FocusableElement | undefined;
    lastFocusableElement?.focus();
  };

  const sentinelEnd = createSentinel();
  sentinelEnd.onfocus = () => {
    const firstFocusableElement = tabbableElements[0] as FocusableElement | undefined;
    firstFocusableElement?.focus();
  };

  insertBefore(sentinelStart, container);
  insertAfter(sentinelEnd, container);

  tryFocus(getFirstFocusableElement(container));

  document.addEventListener('focusin', handleFocusin, { signal, capture: true });

  signal.addEventListener('abort', () => {
    const sentinels = container.parentNode?.querySelectorAll('[data-sentinel]');
    sentinels?.forEach((sentinel) => sentinel.remove());

    containerStack.delete(container);
    tryFocus(focusedElementBeforeActivation);
    focusedElementBeforeActivation = null;
    recentlyFocused = null;
  });

  function getFirstFocusableElement(container: HTMLElement) {
    if (container.hasAttribute('data-autofocus') && isFocusable(container)) {
      return container;
    }

    const element = container.querySelector<HTMLElement>('[data-autofocus]');
    if (element && isFocusable(element)) {
      return element;
    }

    const focusableElements = focusable(container).filter((element) => !element.hasAttribute('data-sentinel'));
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

  return controller;
}

function createSentinel() {
  const sentinel = document.createElement('span');
  sentinel.setAttribute('tabindex', '0');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.setAttribute('data-sentinel', '');
  sentinel.style.position = 'fixed';
  sentinel.style.top = '1px';
  sentinel.style.left = '1px';
  sentinel.style.width = '1px';
  sentinel.style.height = '0px';
  sentinel.style.padding = '0px';
  sentinel.style.margin = '-1px';
  sentinel.style.overflow = 'hidden';
  sentinel.style.clip = 'rect(0px, 0px, 0px, 0px)';
  sentinel.style.whiteSpace = 'nowrap';
  sentinel.style.borderWidth = '0px';
  return sentinel;
}

function insertBefore(newNode: HTMLElement, container: HTMLElement) {
  container.parentNode?.insertBefore(newNode, container);
}

function insertAfter(newNode: HTMLElement, container: HTMLElement) {
  container.parentNode?.insertBefore(newNode, container.nextSibling);
}
