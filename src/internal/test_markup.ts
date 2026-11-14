/**
 * For the element tests only: it is left out of the build. The tests write their elements' markup by hand, which goes
 * stale without a word when a component's template changes. Each checks its markup here against what its component
 * asks of the element, which `test/components/markup_contract_test.rb` writes to `test/fixtures/markup`.
 */

/** An element with a target, an action, a behavior, a role or `popover`: what its custom element reads it by. */
export interface MarkedElement {
  tag: string;
  target: string | null;
  actions: string[];
  behavior: string | null;
  role: string | null;
  popover: string | null;
}

const MARKS = ['data-target', 'data-action', 'data-behavior', 'role', 'popover'];

/** The key of the marked elements that only have to be something the component renders too. */
const LOOSE = 'anything else';

/** The marked elements `name`'s component renders, as the component test last wrote them. */
export async function componentMarkup(name: string): Promise<MarkedElement[]> {
  const response = await fetch(`/test/fixtures/markup/${name}.json`);
  return response.json();
}

/** The marked elements in `html`, a template's content included. */
export function markedElements(html: string): MarkedElement[] {
  const template = document.createElement('template');
  template.innerHTML = html;
  return elementsIn(template.content)
    .filter((element) => MARKS.some((mark) => element.hasAttribute(mark)))
    .map((element) => ({
      tag: element.localName,
      target: element.getAttribute('data-target'),
      actions: (element.getAttribute('data-action') ?? '').split(/\s+/).filter(Boolean).sort(),
      behavior: element.getAttribute('data-behavior'),
      role: element.getAttribute('role'),
      popover: element.getAttribute('popover'),
    }));
}

function elementsIn(root: ParentNode): Element[] {
  return [...root.querySelectorAll('*')].flatMap((element) =>
    element instanceof HTMLTemplateElement ? [element, ...elementsIn(element.content)] : [element],
  );
}

/**
 * How the hand-written `html` differs from what the component asks of its element, each as a line to read, or none
 * when it doesn't.
 *
 * Targets, behaviors and custom elements have to match both ways: the markup has each one the component renders, marked
 * the same, and none of its own. Anything else that is marked, such as a close button or an option, only has to be
 * something the component renders too, as the markup leaves out what its tests don't need.
 */
export function markupDifferences(html: string, component: MarkedElement[]): string[] {
  const written = byKey(markedElements(html));
  const rendered = byKey(component);
  const differences: string[] = [];

  for (const key of new Set([...written.keys(), ...rendered.keys()])) {
    const ours = [...(written.get(key) ?? [])].sort();
    const theirs = [...(rendered.get(key) ?? [])].sort();
    if (key === LOOSE) {
      for (const each of ours.filter((each) => !theirs.includes(each))) {
        differences.push(`the component renders nothing like ${each}`);
      }
    } else if (ours.join('\n') !== theirs.join('\n')) {
      differences.push(`${key}: written as [${ours.join(', ')}], rendered as [${theirs.join(', ')}]`);
    }
  }
  return differences;
}

function byKey(elements: MarkedElement[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const element of elements) {
    const key = keyOf(element);
    map.set(key, (map.get(key) ?? new Set()).add(describe(element)));
  }
  return map;
}

function keyOf({ tag, target, behavior }: MarkedElement): string {
  if (target) return `target ${target}`;
  if (behavior) return `behavior ${behavior}`;
  if (tag.includes('-')) return `element ${tag}`;
  return LOOSE;
}

function describe({ tag, actions, role, popover }: MarkedElement): string {
  const marks = [
    actions.length && `actions ${actions.join(' ')}`,
    role && `role ${role}`,
    popover && `popover ${popover}`,
  ];
  return [`<${tag}>`, ...marks.filter(Boolean)].join(' ');
}
