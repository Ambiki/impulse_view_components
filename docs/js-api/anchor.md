# Anchor API

```js
const anchor = document.querySelector('awc-anchor');
```

## Properties

### `anchorId`

The `id` of the element to position against. Changing it while the element is active moves the element to the new
anchor.

```js
anchor.anchorId = 'other-button';
```

### `active`

Whether the element is kept next to its anchor. Setting it starts or stops the element, as `start` and `stop` do.

```js
anchor.active;
// => true
```

### Positioning options

Every other argument of the [Anchor component](../components/anchor.md#keyword-arguments) is also a property, in
camelCase, such as `placement`, `flipPadding` or `autoSize`.

```js
anchor.placement = 'top';
```

## Methods

### `start`

Positions the element and keeps it next to its anchor as the page scrolls or resizes, until `stop` is called. An
element rendered with `active: true` starts on its own.

```js
// <awc-anchor> only positions the element; showing it is up to you.
anchor.hidden = false;
anchor.start();
```

### `stop`

Stops keeping the element next to its anchor. It stays where it was last placed. Resolves on the next frame, so you can
wait for it before hiding the element.

```js
await anchor.stop();
anchor.hidden = true; // or however your app hides it
```

### `reposition`

Positions the element straight away. Changing an option such as `placement` otherwise takes effect from the next time
the element is repositioned, e.g. when the page scrolls. Does nothing while the element is stopped.

```js
anchor.placement = 'top';
await anchor.reposition();
```

## Events

`<awc-anchor>` doesn't emit any events.
