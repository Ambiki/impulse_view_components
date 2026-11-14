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
  /** What it is nested in: the nearest element around it with a target or a behavior, or that is a custom element. */
  inside: string | null;
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
  return elementsIn(template.content, [])
    .filter(({ element }) => MARKS.some((mark) => element.hasAttribute(mark)))
    .map(({ element, around }) => ({
      tag: element.localName,
      target: element.getAttribute('data-target'),
      actions: (element.getAttribute('data-action') ?? '').split(/\s+/).filter(Boolean).sort(),
      behavior: element.getAttribute('data-behavior'),
      role: element.getAttribute('role'),
      popover: element.getAttribute('popover'),
      inside: around.map(nameOf).find(Boolean) ?? null,
    }));
}

/**
 * Every element in `root`, each with the elements around it, nearest first. A template's content counts as inside the
 * template, which the DOM keeps apart from it.
 */
function elementsIn(root: ParentNode, outside: Element[]): Array<{ element: Element; around: Element[] }> {
  return [...root.querySelectorAll('*')].flatMap((element) => {
    const around = [...ancestorsOf(element), ...outside];
    const content = element instanceof HTMLTemplateElement ? elementsIn(element.content, [element, ...around]) : [];
    return [{ element, around }, ...content];
  });
}

function ancestorsOf(element: Element): Element[] {
  const ancestors: Element[] = [];
  for (let parent = element.parentElement; parent; parent = parent.parentElement) ancestors.push(parent);
  return ancestors;
}

/** What an element is known by to the ones nested in it, or `null` for one they aren't said to be inside. */
function nameOf(element: Element): string | null {
  const target = element.getAttribute('data-target');
  if (target) return `target ${target}`;
  const behavior = element.getAttribute('data-behavior');
  if (behavior) return `behavior ${behavior}`;
  return element.localName.includes('-') ? `element ${element.localName}` : null;
}

/**
 * How the hand-written `html` differs from what the component asks of its element, each as a line to read, or none
 * when it doesn't.
 *
 * Targets, behaviors and custom elements have to match both ways: the markup has each one the component renders, as
 * many times, marked the same and nested in the same, and none of its own. Anything else that is marked, such as a
 * close button or an option, only has to be something the component renders too, as the markup leaves out what its
 * tests don't need.
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

function byKey(elements: MarkedElement[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const element of elements) {
    const key = keyOf(element);
    map.set(key, [...(map.get(key) ?? []), summarize(element)]);
  }
  return map;
}

function keyOf({ tag, target, behavior }: MarkedElement): string {
  if (target) return `target ${target}`;
  if (behavior) return `behavior ${behavior}`;
  if (tag.includes('-')) return `element ${tag}`;
  return LOOSE;
}

function summarize({ tag, actions, role, popover, inside }: MarkedElement): string {
  const marks = [
    actions.length && `actions ${actions.join(' ')}`,
    role && `role ${role}`,
    popover && `popover ${popover}`,
    inside && `inside ${inside}`,
  ];
  return [`<${tag}>`, ...marks.filter(Boolean)].join(' ');
}
