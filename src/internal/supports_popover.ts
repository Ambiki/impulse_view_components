/**
 * Whether the browser has the Popover API (Chrome 114, Firefox 125, Safari 17). Without it, the elements that show in the
 * top layer keep their floating element in the page. It is internal: the package's `exports` map doesn't list it.
 */
export default function supportsPopover() {
  return typeof HTMLElement.prototype.showPopover === 'function';
}
