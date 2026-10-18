# Anchor

`Impulse::AnchorComponent` renders an `<awc-anchor>` element: a **floating element**, such as a tooltip or a menu,
that positions itself next to an **anchor** (another element on the page) and stays inside the viewport as the page
scrolls or resizes. It is configured entirely with attributes, so it needs no JavaScript of your own.

The anchor is often the **trigger** (the element that is clicked or hovered to show the floating element), but it
doesn't have to be. For example, a menu opened by a chevron button can be anchored to the whole field.

::: tip Anchor or `useFloatingUI`?
Use `Impulse::AnchorComponent` when you are writing markup and want something positioned. If you are writing your own
[`impulse`](https://github.com/Ambiki/impulse) element that opens and closes a floating element, use the
[`useFloatingUI`](../hooks/use-floating-ui.md) hook instead. Both share the same positioning logic and defaults.
:::

## Usage

```erb
<button type="button" id="anchor-button" class="btn btn-primary">Anchor</button>

<%= render(Impulse::AnchorComponent.new(anchor_id: "anchor-button", active: true, class: "popover bs-popover-auto")) do %>
  <div class="popover-body">I am anchored to the button!</div>
<% end %>
```

## Arguments

### Keyword arguments

| Name                | Default   | Description                                                                                                                                                                                                                                                    |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| anchor_id           | N/A       | The `id` of the element to position against.                                                                                                                                                                                                                   |
| active              | `false`   | Whether the element is positioned when the page loads. Call [`start` and `stop`](../js-api/anchor.md) to change it from JavaScript. While `false`, the element stays where it was last placed, which before it first starts is the viewport's top-left corner. |
| placement           | `bottom`  | The preferred placement. The actual placement may vary to keep the element inside the viewport. One of `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, or `left-end`.        |
| strategy            | `fixed`   | The value of the `position` CSS property. One of `absolute` or `fixed`.                                                                                                                                                                                        |
| distance            | `0`       | The distance in pixels away from the anchor.                                                                                                                                                                                                                   |
| skidding            | `0`       | The distance in pixels along the anchor.                                                                                                                                                                                                                       |
| sync                | `nil`     | Matches the element's size to the anchor's. One of `height`, `width`, or `both`.                                                                                                                                                                               |
| flip                | `true`    | Flips the element to another placement when the preferred one doesn't fit.                                                                                                                                                                                     |
| flip_padding        | `0`       | The padding in pixels to keep from the viewport edge before flipping. Raised past `auto_size_padding` on the auto sized axis while `auto_size` is set.                                                                                                         |
| fallback_placements | `[]`      | The placements to try, in order, when the preferred one doesn't fit. By default, the opposite side is tried.                                                                                                                                                   |
| fallback_strategy   | `bestFit` | What to do when no placement fits. `bestFit` uses the placement that fits best, and `initialPlacement` uses `placement`.                                                                                                                                       |
| shift               | `true`    | Shifts the element along the anchor to keep it inside the viewport.                                                                                                                                                                                            |
| shift_padding       | `0`       | The padding in pixels to keep from the viewport edge while shifting.                                                                                                                                                                                           |
| auto_size           | `nil`     | Exposes the space available to the element as the `--awc-auto-size-height` and `--awc-auto-size-width` CSS custom properties. One of `height`, `width`, or `both`.                                                                                             |
| auto_size_padding   | `0`       | The padding in pixels to keep from the viewport edge when measuring the available space.                                                                                                                                                                       |
| arrow_padding       | `0`       | The padding in pixels between the arrow and the edges of the element.                                                                                                                                                                                          |

Any other keyword arguments are passed to the `<awc-anchor>` element as HTML attributes.

## Examples

### Adding an arrow

Mark a child element with `data-arrow` to have it point at the anchor. The element's chosen placement is set as its
`x-placement` attribute, which you can use to style the arrow for each side.

```erb{2}
<%= render(Impulse::AnchorComponent.new(anchor_id: "anchor-button", active: true, distance: 8)) do %>
  <div class="arrow" data-arrow></div>
  <div class="popover-body">I am anchored to the button!</div>
<% end %>
```

### Fitting the viewport

Set `auto_size` and cap the element's size with the custom property it exposes, so a tall menu scrolls instead of
overflowing the viewport. When the cap squashes the element and the other side of the anchor has more room, the element
flips there.

```erb
<%= render(Impulse::AnchorComponent.new(anchor_id: "anchor-button", active: true, auto_size: "height", auto_size_padding: 8, class: "menu")) do %>
  ...
<% end %>
```

```css
.menu {
  max-height: var(--awc-auto-size-height);
  overflow-y: auto;
}
```

## Imports

```js
import '@ambiki/impulse-view-components/dist/elements/anchor';
```

## JS API

[Read here](../js-api/anchor.md).
