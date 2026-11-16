import uniqueId from 'src/internal/unique_id';

/** An option set from code, as `setOptions` and `addOption` take it. */
export interface AutocompleteOptionData {
  value: string;
  text: string;
  description?: string;
  disabled?: boolean;
}

/** A group of options set from code, as `setOptions` takes it. Groups don't nest. */
export interface AutocompleteGroupData {
  title: string;
  options: AutocompleteOptionData[];
}

/** Whether `data` is a group rather than an option. */
export function isGroupData(data: AutocompleteOptionData | AutocompleteGroupData): data is AutocompleteGroupData {
  return 'options' in data;
}

/**
 * Builds an option from `template`, the option `Impulse::AutocompleteComponent` renders for a local select, filled in
 * with `data`. The option's markup is the component's: only what `data` says is written here.
 */
export function buildOption(
  template: HTMLTemplateElement,
  { value, text, description, disabled = false }: AutocompleteOptionData,
): HTMLElement {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const option = fragment.querySelector<HTMLElement>('[role="option"]')!;
  // Each copy takes ids of its own: the template's would be shared by every option built from it. The combobox gives
  // the option an id when it first activates it.
  option.removeAttribute('id');
  const textElement = option.querySelector('[data-behavior="option-text"]')!;
  textElement.id = uniqueId();
  option.setAttribute('aria-labelledby', textElement.id);
  option.setAttribute('value', value);
  option.setAttribute('data-text', text);
  textElement.textContent = text;
  // As `Impulse::Autocomplete::OptionComponent` renders `disabled: true`.
  option.toggleAttribute('disabled', disabled);
  option.setAttribute('aria-disabled', String(disabled));
  option.classList.toggle('disabled', disabled);

  // The template has a description, which the component leaves out of an option that has none.
  const descriptionElement = option.querySelector('[data-behavior="option-description"]')!;
  if (description) {
    descriptionElement.textContent = description;
  } else {
    descriptionElement.remove();
  }
  return option;
}

/**
 * Builds a group from `template`, the group `Impulse::AutocompleteComponent` renders for a local select, titled `title`
 * and holding `options`.
 */
export function buildGroup(template: HTMLTemplateElement, { title }: AutocompleteGroupData, options: HTMLElement[]) {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const group = fragment.querySelector<HTMLElement>('[role="group"]')!;
  // The component renders a group only with an option in it, which isn't one of these.
  for (const option of group.querySelectorAll('[role="option"]')) {
    option.remove();
  }

  const titleElement = group.querySelector('[data-behavior="group-title"]')!;
  titleElement.id = uniqueId();
  titleElement.textContent = title;
  group.setAttribute('aria-labelledby', titleElement.id);
  group.setAttribute('data-text', title);
  group.append(...options);
  return group;
}
