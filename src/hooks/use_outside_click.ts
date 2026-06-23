import type { ImpulseElement } from '@ambiki/impulse';

export type Boundary = Element | null;

type UseOutsideClickOptions = {
  boundaries: Boundary[];
  callback: (event: Event, element: HTMLElement) => void;
};

export default function useOutsideClick(element: ImpulseElement, { boundaries, callback }: UseOutsideClickOptions) {
  const controller = new AbortController();
  const { signal } = controller;

  let initialClickTarget: HTMLElement | null = null;

  function setInitialClickTarget(event: Event) {
    initialClickTarget = (event.composedPath?.()?.[0] || event.target) as HTMLElement;
  }

  function handleOutsideClick(event: Event, resolveTarget: (event: Event) => HTMLElement | null) {
    if (!initialClickTarget) return;
    if (event.defaultPrevented) return;

    const target = resolveTarget(event);
    if (!target) return;
    // Return if the target is not present in the DOM anymore.
    if (!target.getRootNode().contains(target) || !target.isConnected) return;

    for (const boundary of boundaries) {
      if (boundary === null) continue;
      if (boundary.contains(target)) return;
      if (event.composed && event.composedPath().includes(boundary)) return;
    }

    callback(event, target);
    initialClickTarget = null;
  }

  document.addEventListener('mousedown', setInitialClickTarget, { capture: true, signal });
  document.addEventListener('click', (event) => handleOutsideClick(event, () => initialClickTarget), {
    capture: true,
    signal,
  });

  function destroy() {
    initialClickTarget = null;
    controller.abort();
  }

  const disconnectedCallback = element.disconnected.bind(element);
  Object.assign(element, {
    disconnected() {
      destroy();
      disconnectedCallback();
    },
  });
}
