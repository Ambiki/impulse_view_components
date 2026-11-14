import type { ToastOptions } from './region';
import type { ToastVariant } from './toast';
import { whenInitialized } from '@ambiki/impulse';
import AwcToastRegionElement from './region';
import AwcToastElement from './toast';

/** A message for one step of `showToast.promise`, or a function of what the promise settled with that returns one. */
type ToastPromiseMessage<T> = string | ((outcome: T) => string);

/** What `showToast.promise` says while a promise is pending, and once it settles. */
export interface ToastPromiseOptions<T> {
  /** The message while the promise is pending. */
  loading: string;
  /** The message once the promise resolves, or a function of its value that returns one. */
  success: ToastPromiseMessage<T>;
  /** The message once the promise rejects, or a function of the reason that returns one. */
  error: ToastPromiseMessage<unknown>;
  /** A title, shown above the message at every step. */
  title?: string;
  /** The toast's `id`. Without one, each call gets its own. */
  id?: string;
}

/** Counts the toasts `showToast.promise` has shown, to give each its own `id`. */
let promiseToasts = 0;

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

/**
 * Shows a toast while `promise` is pending, which stays until it settles, then says how it settled in the same toast:
 * a success toast once it resolves, or a danger toast once it rejects. Returns `promise`, whose rejection the toast
 * counts as handled.
 */
showToast.promise = function <T>(
  promise: Promise<T>,
  { loading, success, error, title, id = `awc-toast-promise-${++promiseToasts}` }: ToastPromiseOptions<T>,
): Promise<T> {
  const loadingToast = showToast(loading, { id, title, duration: Infinity });
  const settle = async <O>(message: ToastPromiseMessage<O>, outcome: O, variant: ToastVariant) => {
    // Once the loading toast shows, so that a promise that has already settled doesn't have its outcome replaced by it.
    const toast = await loadingToast;
    if (!toast) return;
    let text: string;
    try {
      text = typeof message === 'function' ? message(outcome) : message;
    } catch (bug) {
      // The loading toast doesn't stay for good, and the app hears of its own error.
      await toast.hide();
      throw bug;
    }
    await showToast(text, { id, title, variant });
  };
  void promise.then(
    (value) => settle(success, value, 'success'),
    (reason) => settle(error, reason, 'danger'),
  );
  return promise;
};

export { AwcToastElement, AwcToastRegionElement };
export type { ToastOptions, ToastPlacement } from './region';
export type { ToastVariant } from './toast';
