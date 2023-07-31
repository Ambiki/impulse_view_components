/**
 * @example
 *
 * stripCSSUnit('18px')
 * //=> 18
 */
export function stripCSSUnit(value: string): number {
  return Number(value.replace(/[^-\d.]/g, ''));
}
