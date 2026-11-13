import type { ImpulseElement } from '@ambiki/impulse';
import composedContains from 'src/internal/composed_contains';
import onDisconnect from 'src/internal/on_disconnect';

export type Boundary = Element | null;

export interface UseOutsideClickOptions {
  boundaries: Boundary[];
  callback: (event: Event, element: HTMLElement) => void;
}

export default function useOutsideClick(element: ImpulseElement, { boundaries, callback }: UseOutsideClickOptions) {
  const controller = new AbortController();
  const { signal } = controller;

  let initialClickTarget: HTMLElement | null = null;

  function setInitialClickTarget(event: MouseEvent) {
    // A press with a button other than the primary one ends in no click, so it would linger. A plain `Event` has no
    // `button`, and counts.
    initialClickTarget = event.button > 0 ? null : ((event.composedPath?.()?.[0] || event.target) as HTMLElement);
  }

  function forgetPress() {
    initialClickTarget = null;
  }

  function handleOutsideClick(event: Event) {
    // A click ends its press, whatever becomes of it, so that a later click without a press isn't taken for it.
    const target = initialClickTarget;
    initialClickTarget = null;
    if (!target) return;
    if (event.defaultPrevented) return;
    // Return if the target is not present in the DOM anymore.
    if (!target.getRootNode().contains(target) || !target.isConnected) return;

    // Judged by where the press started, in a shadow root too: released elsewhere, the click lands outside it.
    if (boundaries.some((boundary) => boundary && composedContains(boundary, target))) return;

    callback(event, target);
  }

  document.addEventListener('mousedown', setInitialClickTarget, { capture: true, signal });
  document.addEventListener('click', handleOutsideClick, { capture: true, signal });
  // A press that opens the context menu, such as ctrl+click on macOS, or that starts a drag ends in no click either.
  document.addEventListener('contextmenu', forgetPress, { capture: true, signal });
  document.addEventListener('dragstart', forgetPress, { capture: true, signal });

  onDisconnect(element, () => {
    forgetPress();
    controller.abort();
  });
}
