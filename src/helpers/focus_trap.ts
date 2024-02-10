import { FocusableElement, focusable, isFocusable, tabbable } from 'tabbable';
import uniqueId from './unique_id';

type Boundary = Element | null;
const containerStack: Set<Element> = new Set();

export default function focusTrap(
  container: HTMLElement,
  {
    abortSignal,
    surround = true,
    boundaries = [],
  }: { abortSignal?: AbortSignal; surround?: boolean; boundaries?: Boundary[] } = {}
) {
  const controller = new AbortController();
  const signal = abortSignal || controller.signal;

  let recentlyFocused: HTMLElement | FocusableElement | null;

  // TODO: Remove this once ambiki migrates to dialog component.
  boundaries.forEach((boundary) => {
    if (boundary) {
      containerStack.add(boundary);
    }
  });

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

  const id = uniqueId();
  container.setAttribute('data-focus-trap-id', id);
  containerStack.add(container);

  const sentinelStart = createSentinel(id);
  sentinelStart.onfocus = () => {
    const tabbableElements = tabbable(container).filter((element) => !element.hasAttribute('data-sentinel-for'));
    const lastFocusableElement = tabbableElements[tabbableElements.length - 1] as FocusableElement | undefined;
    (lastFocusableElement || container).focus();
  };

  const sentinelEnd = createSentinel(id);
  sentinelEnd.onfocus = () => {
    const tabbableElements = tabbable(container).filter((element) => !element.hasAttribute('data-sentinel-for'));
    const firstFocusableElement = tabbableElements[0] as FocusableElement | undefined;
    (firstFocusableElement || container).focus();
  };

  if (surround) {
    insertBefore(sentinelStart, container);
    insertAfter(sentinelEnd, container);
  } else {
    // Fix for top level popovers. Cannot insertAfter or insertBefore.
    container.prepend(sentinelStart);
    container.append(sentinelEnd);
  }

  tryFocus(getFirstFocusableElement(container));

  document.addEventListener('focusin', handleFocusin, { signal, capture: true });

  signal.addEventListener('abort', () => {
    const sentinels = container.parentNode?.querySelectorAll(`[data-sentinel-for="${id}"]`);
    sentinels?.forEach((sentinel) => sentinel.remove());
    container.removeAttribute('data-focus-trap-id');

    containerStack.delete(container);
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

    const focusableElements = focusable(container).filter((element) => !element.hasAttribute('data-sentinel-for'));
    if (focusableElements[0]) {
      return focusableElements[0];
    }

    if (isFocusable(container)) {
      return container;
    }
  }

  function tryFocus(element: HTMLElement | FocusableElement | null | undefined) {
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

function createSentinel(id: string) {
  const sentinel = document.createElement('span');
  sentinel.setAttribute('tabindex', '0');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.setAttribute('data-sentinel-for', id);
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
