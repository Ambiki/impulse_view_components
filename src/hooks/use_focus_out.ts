import type { ImpulseElement } from '@ambiki/impulse';
import type { Boundary } from 'src/hooks/use_outside_click';
import onDisconnect from 'src/internal/on_disconnect';

interface UseFocusOutOptions {
  boundaries: Boundary[];
  callback: (event: FocusEvent, target: HTMLElement) => void;
}

/**
 * Calls `callback` when focus moves to an element outside every boundary, such as on Tab past a popover's last element.
 * Focus that leaves the page, or falls back to `<body>`, isn't a move to an element, so it doesn't count.
 *
 * The focus a press outside moves is left to `useOutsideClick`, which sees the whole press: a press on a field outside
 * would otherwise count twice, once as it takes focus and again as the click.
 */
export default function useFocusOut(element: ImpulseElement, { boundaries, callback }: UseFocusOutOptions) {
  const controller = new AbortController();
  const { signal } = controller;
  const isInside = (node: Node) => boundaries.some((boundary) => boundary?.contains(node));

  // What the latest press outside landed on, until its click has been handled. A press inside doesn't count: a button
  // there may move focus out itself, such as by opening a dialog elsewhere.
  let pressedOutside: Node | null = null;
  document.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target as Node;
      pressedOutside = isInside(target) ? null : target;
    },
    { capture: true, signal },
  );
  document.addEventListener('click', () => setTimeout(() => (pressedOutside = null)), { capture: true, signal });
  document.addEventListener('keydown', () => (pressedOutside = null), { capture: true, signal });

  document.addEventListener(
    'focusin',
    (event) => {
      const target = event.target as HTMLElement;
      if (isInside(target)) return;
      // The press moved focus to what it landed on, or to the focusable element around that.
      if (pressedOutside && target.contains(pressedOutside)) return;
      callback(event, target);
    },
    { capture: true, signal },
  );

  onDisconnect(element, () => controller.abort());
}
