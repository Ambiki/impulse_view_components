/**
 * Whether `node` is `container` or inside it, as an event's composed path runs: from slotted content into its slot, and
 * from a shadow root out to its host. `Node.contains` does neither.
 */
export default function composedContains(container: Node, node: Node) {
  for (let current: Node | null = node; current; current = composedParent(current)) {
    if (current === container) return true;
  }
  return false;
}

function composedParent(node: Node): Node | null {
  if ((node instanceof Element || node instanceof Text) && node.assignedSlot) return node.assignedSlot;
  if (node instanceof ShadowRoot) return node.host;
  return node.parentNode;
}
