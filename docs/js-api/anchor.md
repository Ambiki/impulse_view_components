# Anchor API

```js
const anchor = document.querySelector('awc-anchor');
```

## Methods

### `active`

Whether the element is positioned. Set it to `true` to position the element and keep it next to its anchor as the page
scrolls or resizes, and to `false` to stop. Once stopped, the element stays where it was last placed.

```js
// Show and position the element.
anchor.hidden = false;
anchor.active = true;

// Hide it and stop positioning.
anchor.hidden = true;
anchor.active = false;
```

### `anchorId`

The `id` of the element to position against. Changing it moves the element to the new anchor.

```js
anchor.anchorId = 'other-button';
```

### `reposition`

Positions the element straight away. Changing an option such as `placement` otherwise takes effect from the next time
the element is repositioned, e.g. when the page scrolls. Does nothing while `active` is `false`.

```js
anchor.placement = 'top';
await anchor.reposition();
```

### `start`

Starts keeping the element next to its anchor. Prefer setting `active`, which calls this for you.

```js
anchor.start();
```

### `stop`

Stops keeping the element next to its anchor. Resolves on the next frame. Prefer setting `active`, which calls this
for you.

```js
await anchor.stop();
```

## Events

`<awc-anchor>` doesn't emit any events.
