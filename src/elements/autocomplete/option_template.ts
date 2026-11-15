import uniqueId from 'src/internal/unique_id';

/** An option set from code, as `setOptions` and `addOption` take it. */
export interface AutocompleteOptionData {
  value: string;
  text: string;
  description?: string;
  disabled?: boolean;
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
