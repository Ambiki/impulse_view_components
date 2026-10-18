# Popover

A popover is a floating panel that can display rich content like navigation menus and mobile menus.

## Usage

```erb
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger(class: "btn btn-primary") { "Toggle popover" } %>
  <% c.with_body do %>
    <span>And here's some amazing content. It's very engaging. Right?</span>
  <% end %>
<% end %>
```

## Arguments

### Keyword arguments

| Name      | Default   | Description                                                                                                                                                                                                                                                            |
| ------    | --------- | -------------                                                                                                                                                                                                                                                          |
| title     | `nil`     | The title of the popover.                                                                                                                                                                                                                                              |
| placement | `bottom`  | The preferred placement of the popover. The actual placement may vary to keep the element inside the viewport. One of `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, or `left-end`. |
| strategy  | `fixed`   | The value of the `position` CSS property. One of `absolute` or `fixed`.                                                                                                                                                                                                |

## Examples

### Adding a title

You can add a title by setting the `title` argument on the component. It will also add a close button next to it.

```erb{1}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_body { "Body" } %>
<% end %>
```

### Custom header

You can customize the header to add rich content instead of a simple title by calling the `with_header` slot.

```erb{3-6}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_header do %>
    <h2>Custom title</h2>
    <button type="button">Action button</button>
  <% end %>
  <% c.with_body do %>
    <span>And here's some amazing content. It's very engaging. Right?</span>
  <% end %>
<% end %>
```

::: tip Note
You are encouraged to use the `title` argument if there aren't any rich content inside the header.
:::

### Closing the popover

Add the `data-action="click->awc-popover#requestHide"` attribute on the `button` element to close the popover when clicking it.

`requestHide` emits the cancelable `awc-popover:hide` event first, so a listener can keep the popover open, for example
while a form inside it has unsaved changes. `hide` closes it without asking.

```erb{4}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_body do %>
    <button type="button" data-action="click->awc-popover#requestHide">Close</button>
  <% end %>
<% end %>
```

### Nesting popovers

You can nest as many popovers as you want and it will be stacked on top of the parent popover. A nested popover counts
as part of its parent, so moving focus or clicking into it doesn't close the parent. A click outside both, or focus
moving out of both, closes them together, the nested popover first. Escape closes the popover focus is in.

```erb{4-7}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Open" } %>
  <% c.with_body do %>
    <%= render(Impulse::PopoverComponent.new) do |c| %>
      <% c.with_trigger { "Open nested popover" } %>
      <% c.with_body { "Nested contents" } %>
    <% end %>
  <% end %>
<% end %>
```

## Accessibility

The popover is a non-modal dialog, rendered in the browser's [top
layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) so that no `z-index` or `overflow` can hide it.

- The popover has `role="dialog"`, labelled by the `title`, or by the trigger when there is no title or a custom header
  replaces it. The trigger has `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.
- Opening it moves focus into the popover: to the element with `autofocus`, else the first element you can Tab to,
  else the popover itself. A popover rendered open doesn't take focus.
- Escape, a click outside, and focus moving out of the popover, such as Tab past its last element, all ask it to close.
- Closing it returns focus to the trigger when focus was inside the popover, or lost. When focus has moved on to
  something else, such as a field clicked outside, it stays there.
- Closing it closes the popovers nested in it first. A user action asks them first, and one that refuses keeps the
  popover open.

## Slots

### `with_trigger`

The button element that is responsible for showing or hiding the popover.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

### `with_header`

The header of the popover. If you just want to change the title of the popover, pass the `title` argument to
the component.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

### `with_body`

The body of the popover.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `tag`         | `div`     | The name of the HTML tag.                                                 |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/popover';
```

```scss
@import '~@ambiki/impulse-view-components/dist/elements/popover';
```
:::

## JS API
[Read here](../js-api/popover.md).
