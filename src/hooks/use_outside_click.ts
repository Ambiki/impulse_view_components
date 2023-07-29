import type { ImpulseElement } from 'src/impulse';

export type Boundary = Element | null;

type UseOutsideClickOptions = {
  boundaries: Boundary[];
  callback: (event: Event, element: HTMLElement) => void;
};

export default function useOutsideClick(
  element: ImpulseElement & { open: boolean },
  { boundaries, callback }: UseOutsideClickOptions
) {
  let initialClickTarget: HTMLElement | null = null;

  function setInitialClickTarget(event: Event) {
    initialClickTarget = (event.composedPath?.()?.[0] || event.target) as HTMLElement;
  }

  function handleOutsideClick(event: Event, resolveTarget: (event: Event) => HTMLElement | null) {
    if (!initialClickTarget || !element.open) return;
    if (event.defaultPrevented) return;

    const target = resolveTarget(event);
    if (!target) return;

    if (!target.getRootNode().contains(target)) return;

    for (const boundary of boundaries) {
      if (boundary === null) continue;
      if (boundary.contains(target)) return;
      if (event.composed && event.composedPath().includes(boundary)) return;
    }

    callback(event, target);
    initialClickTarget = null;
  }

  document.addEventListener('mousedown', setInitialClickTarget, true);
  document.addEventListener('click', (event) => handleOutsideClick(event, () => initialClickTarget), true);

  function destroy() {
    document.removeEventListener('mousedown', setInitialClickTarget, true);
    document.removeEventListener('click', (event) => handleOutsideClick(event, () => initialClickTarget), true);
  }

  const disconnectedCallback = () => element.disconnected.bind(element);
  Object.assign(element, {
    disconnected() {
      destroy();
      disconnectedCallback();
    },
  });
}