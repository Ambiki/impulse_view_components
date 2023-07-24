import { cycle } from 'src/helpers/array';
import type { ImpulseElement } from 'src/impulse';
import { FocusableElement, focusable, tabbable } from 'tabbable';

export type UseFocusTrap = {
  start: () => void;
  stop: () => void;
};

const elements: HTMLElement[] = [];

export default function useFocusTrap(element: ImpulseElement, { trap }: { trap: HTMLElement }): UseFocusTrap {
  let focusedElementBeforeActivation: HTMLElement | null;
  let recentlyFocused: HTMLElement | FocusableElement;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const tabbableElements = tabbable(trap) as HTMLElement[];
    const activeElement = trap.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    const nextActiveElement = cycle(tabbableElements, activeElement, event.shiftKey ? -1 : 1);
    tryFocus(nextActiveElement);
  }

  function handleFocusin(event: Event) {
    const target = (event.composedPath?.()?.[0] || event.target) as HTMLElement;

    for (const element of elements) {
      if (element.contains(target)) {
        recentlyFocused = target;
        return;
      }
    }

    tryFocus(recentlyFocused || trap);
  }

  function tryFocus(item?: HTMLElement | FocusableElement | null) {
    if (!item) {
      tryFocus(trap);
      return;
    }

    if (item === document.activeElement) return;

    item.focus({ preventScroll: true });
    recentlyFocused = item;
  }

  function getFirstFocusableElement(trap: HTMLElement) {
    if (trap.hasAttribute('data-autofocus')) {
      return trap;
    }
    return trap.querySelector<HTMLElement>('[data-autofocus]') || focusable(trap)[0] || trap;
  }

  function start() {
    focusedElementBeforeActivation = document.activeElement as HTMLElement;
    elements.push(trap);
    tryFocus(getFirstFocusableElement(trap));
  }

  function stop() {
    const index = elements.indexOf(trap);
    if (index === -1) return;
    elements.splice(index, 1);
    tryFocus(focusedElementBeforeActivation);
  }

  trap.addEventListener('keydown', handleKeydown, true);
  document.addEventListener('focusin', handleFocusin, true);

  function destroy() {
    trap.removeEventListener('keydown', handleKeydown, true);
    document.removeEventListener('focusin', handleFocusin, true);
  }

  const disconnectedCallback = () => element.disconnected.bind(element);
  Object.assign(element, {
    disconnected() {
      destroy();
      disconnectedCallback();
    },
  });

  return { start, stop };
}
