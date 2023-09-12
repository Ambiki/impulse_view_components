import { isFocusable } from 'tabbable';

export function isLooselyFocusable(element: HTMLElement) {
  let target: HTMLElement | null = element;
  while (target !== null) {
    if (isFocusable(target) || target.hasAttribute('data-loosely-focusable')) {
      return true;
    }

    target = target.parentElement;
  }

  return false;
}
