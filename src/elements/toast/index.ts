import type { ToastOptions } from './region';
import { whenInitialized } from '@ambiki/impulse';
import AwcToastRegionElement from './region';
import AwcToastElement from './toast';

/**
 * Shows a toast in the page's toast region, built from `content`: a message, or a template holding a toast. Showing a
 * toast with the `id` of one already showing updates that one in place. Resolves with the toast once it is showing, or
 * with `null` when the page has no region.
 */
export async function showToast(
  content: string | HTMLTemplateElement,
  options: ToastOptions = {},
): Promise<AwcToastElement | null> {
  const region = document.querySelector('awc-toast-region');
  if (!region) {
    console.warn('showToast: the page has no <awc-toast-region>, so the toast was not shown.');
    return null;
  }
  await whenInitialized(region);
  return region.showToast(content, options);
}

export { AwcToastElement, AwcToastRegionElement };
export type { ToastOptions, ToastPlacement } from './region';
export type { ToastVariant } from './toast';
