# Helpers

Plain functions the elements use, for apps to use too.

```js
import { cycle, debounce, scrollLock } from '@ambiki/impulse-view-components/helpers';
```

## `cycle`

Returns the item after `item` in `items`, or before it with `-1`, wrapping round at either end. An item that isn't in
the list starts from the first item, or the last with `-1`.

```js
cycle(['pen', 'pencil', 'chalk'], 'chalk', 1);
// => 'pen'
```

## `debounce`

Returns a function that calls `func` once calls to it have stopped for `wait` milliseconds (166 by default), with the
last call's arguments and `this`. `clear()` drops the pending call.

```js
const search = debounce((query) => fetchResults(query), 300);
search.clear();
```

The returned function's type is exported as `Cancelable`, alongside `func`'s own.

## `scrollLock`

Stops the page scrolling, by hiding the `body` element's overflow and padding it by the scroll bar's width so that the
page doesn't shift. Returns an `AbortController`; aborting it releases the lock. The page stays locked until every
lock is released, in any order.

```js
const lock = scrollLock(element);
lock.abort();
```

Pass `signal` to release the lock with a signal you already have.

```js
scrollLock(element, { signal: controller.signal });
```
