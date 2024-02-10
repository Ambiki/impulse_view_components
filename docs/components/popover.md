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

| Name             | Default    | Description                                                                                                                                                                                                                                                            |
| ------           | ---------  | -------------                                                                                                                                                                                                                                                          |
| title            | `nil`      | The title of the popover.                                                                                                                                                                                                                                              |
| placement        | `bottom`   | The preferred placement of the popover. The actual placement may vary to keep the element inside the viewport. One of `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, or `left-end`. |
| strategy         | `absolute` | The value of the `position` CSS property. One of `absolute` or `fixed`.                                                                                                                                                                                                |
| click_boundaries | `[]`       | The CSS selector of the element that should avoid closing the popover when clicked inside.                                                                                                                                                                             |

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

Add the `data-action="click->awc-popover#hide"` attribute on the `button` element to close the popover when clicking it.

```erb{4}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_body do %>
    <button type="button" data-action="click->awc-popover#hide">Close</button>
  <% end %>
<% end %>
```

### Nesting popovers

You can nest as many popovers as you want and it will be stacked on top of the parent popover.

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
import '@ambiki/impulse-view-components/dist/elements/popover';
```

```scss
@import '~@ambiki/impulse-view-components/dist/elements/popover';
```
:::

## JS API
[Read here](../js-api/popover.md).
