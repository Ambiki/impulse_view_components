export interface BaseOptionEvent {
  target: HTMLElement;
  text: string;
  value: string;
}

/**
 * Reads the detail an option or a tag carries. The two events that reference one — `commit` and `remove` — send the
 * same three fields, read from the same two attributes, so they read them the same way.
 */
export function optionEventDetail(target: HTMLElement): BaseOptionEvent {
  return {
    target,
    value: target.getAttribute('value') ?? '',
    text: target.dataset.text || '',
  };
}

export interface AwcAutocompleteCommitEvent extends BaseOptionEvent {}
export interface AwcAutocompleteRemoveEvent extends BaseOptionEvent {}

/** The detail of an event that carries no information beyond the fact that it happened. */
type NoDetail = Record<string, never>;

/**
 * Every event the element emits under its `awc-autocomplete:` prefix, mapped to the detail it carries.
 *
 * This is the single place an event is declared. Adding an entry here is what lets `emitEvent` dispatch it and what
 * types it for listeners, so the two can never drift apart. Remember to document the new event in
 * `docs/js-api/autocomplete.md`.
 */
export interface AutocompleteEventDetails {
  show: NoDetail;
  shown: NoDetail;
  hide: NoDetail;
  hidden: NoDetail;
  reset: NoDetail;
  clear: NoDetail;
  commit: AwcAutocompleteCommitEvent;
  remove: AwcAutocompleteRemoveEvent;
}

export type AutocompleteEventName = keyof AutocompleteEventDetails;

/** The prefixed event names, in the shape `GlobalEventHandlersEventMap` expects. */
export type AutocompleteEventMap = {
  [Name in AutocompleteEventName as `awc-autocomplete:${Name}`]: CustomEvent<AutocompleteEventDetails[Name]>;
};

/** Makes the detail argument optional for the events that do not carry one. */
export type AutocompleteEventArgs<Name extends AutocompleteEventName> = AutocompleteEventDetails[Name] extends NoDetail
  ? [detail?: AutocompleteEventDetails[Name]]
  : [detail: AutocompleteEventDetails[Name]];

/**
 * The events emitted while fetching options from a remote source.
 *
 * These four are deliberately unlike the events above: they are emitted without the `awc-autocomplete:` prefix and
 * they do not bubble, mirroring the native resource-loading events they are named after. Three of them — `load`,
 * `error` and `loadstart` — are already declared on `GlobalEventHandlersEventMap` by the DOM lib as `Event` and
 * `ErrorEvent`, so they cannot join `AutocompleteEventMap` without conflicting with those declarations, and renaming
 * them would break every listener that exists today. They stay as they are, and stay untyped.
 */
export type RemoteEventName = 'loadstart' | 'load' | 'error' | 'loadend';

/** The dispatch policy that sets those four apart, kept next to the names it applies to. */
export const REMOTE_EVENT_INIT = { bubbles: false, prefix: false } as const;
