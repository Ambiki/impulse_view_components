---
paths:
  - src/**
---

# Writing JavaScript

The elements are built on Impulse. Prefer its utilities to the DOM's own: they follow elements that are added, moved and
removed, which a page morph does all the time.

Impulse documentation: <https://ambiki.github.io/impulse/llms-full.txt> holds the whole site in one file. Each page is
also served as Markdown, for example <https://ambiki.github.io/impulse/utilities/connected.md>.

## Listen with `on`, not `addEventListener`

Register an element's listeners for itself and its content with `on`, in `connected()`, and remove them in
`disconnected()` through a signal.

**Bad**

```ts
connected() {
  this.addEventListener('click', this.handleClick);
}
```

**Good**

```ts
import { on } from '@ambiki/impulse';

connected() {
  this.listeners = new AbortController();
  on('click', this.localName, this.handleClick, { signal: this.listeners.signal });
}

disconnected() {
  this.listeners?.abort();
}

private handleClick = (event: MouseEvent) => {
  // Every instance of the element hears every match.
  if (event.currentTarget !== this) return;
};
```

- `on` shares one listener on `document` for each event, so a handler hears the event for every instance of the
  element. Check `event.currentTarget === this` first (`clipboard_copy/index.ts`, `dialog/index.ts`).
- Events that don't bubble (`focus`, `blur`, `pointerenter`, `pointerleave`, `close`, `scroll`) need
  `{ capture: true }`. They then reach the handler for the element's descendants too, so check `event.target === this`
  when only the element's own counts (`toast/region.ts`, `handlePointerleave`).
- Actions on markup a Ruby component renders, such as a close button, stay `data-action` in its template.
- `addEventListener` is only for what has no element to match: `document` and `window` events (a hotkey's `keydown`,
  `blur` and `focus`, `visibilitychange`, `pageshow`), an `AbortSignal`, or a form the element sits in. Pass the same
  `{ signal }`, so that `disconnected()` removes them too.

## Watch elements with `connected`, not `MutationObserver`

**Bad**

```ts
const observer = new MutationObserver((records) => {
  if (records.some((record) => record.target instanceof HTMLDialogElement)) this.follow();
});
observer.observe(document.documentElement, { subtree: true, attributeFilter: ['open'] });
```

**Good**

```ts
import { connected } from '@ambiki/impulse';

const stop = connected('dialog[open]', (dialog) => {
  // Runs for every matching element now, and for every one that matches later: added, or an attribute change.

  return () => {
    // Runs once it stops matching: removed, or the attribute changed again.
  };
});
```

- `connected` returns a function that stops watching. Call it from `disconnected()`.
- Stopping runs the cleanup of every element still matching. A callback that moves or removes the element that
  registered the watch stops the watch in the middle of it: defer the move with `queueMicrotask` (`toast/region.ts`
  and `internal/modal_dialog_stack.ts`).
- An `ImpulseElement` has its own `connected()` method. Inside one, import the function under another name:
  `import { connected as whenConnected } from '@ambiki/impulse'`.
- [`disconnected`](https://ambiki.github.io/impulse/utilities/disconnected.md) is the counterpart for code that only
  runs on removal.

## Wait for another element with `whenInitialized`

Impulse starts an element asynchronously: its `connected()` runs after an `await`. Before calling another Impulse
element's methods or reading its properties, wait for it with `whenInitialized`, not `customElements.whenDefined`, which
resolves before the element has started.

```ts
import { whenInitialized } from '@ambiki/impulse';

const popover = await whenInitialized(this.popover);
await popover.reposition();
```

Pass an element, never `null`. It has no timeout by default, so a mistyped tag name never resolves.

## Emit events with `this.emit`

`this.emit('shown')` dispatches `awc-toast:shown`, prefixed with the element's tag, bubbling and composed. Don't build a
`CustomEvent` by hand. Declare each event in the element's `GlobalEventHandlersEventMap`, as CLAUDE.md asks.

## Before finishing

- `yarn lint` and `yarn typecheck`.
- `yarn web-test-runner <file>` for the elements you changed, in Chromium, Firefox and WebKit.
