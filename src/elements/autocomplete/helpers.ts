/**
 * Returns the value of the option.
 */
export function getValue(option: HTMLElement): string {
  return option.getAttribute('value') || '';
}

/**
 * Returns the display text of the option.
 */
export function getText(option: HTMLElement): string {
  return option.getAttribute('data-text') || option.innerText.trim();
}
