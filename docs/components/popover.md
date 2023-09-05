# Popover

A popover is a floating panel that can display rich content like navigation menus and mobile menus.

## Usage

```erb
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_body do %>
    <span>And here's some amazing content. It's very engaging. Right?</span>
  <% end %>
<% end %>
```

## Arguments

| Name             | Default   | Description                                                                                                    |
| ------           | --------- | -------------                                                                                                  |
| title            | `nil`     | The title of the popover.                                                                                      |
| open             | `false`   | Whether the popover is open or not.                                                                            |
| placement        | `bottom`  | The preferred placement of the popover. The actual placement may vary to keep the element inside the viewport. |
| click_boundaries | `[]`      | The CSS selector of the element that should avoid closing the popover when clicked inside.                     |

## Examples

### Custom header

You can customize the header to add rich content instead of a simple title by calling the `with_header` slot. You will
still need to pass the `title` argument to the popover component for accessibility reasons.

```erb{3}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_header { "Custom header" } %>
  <% c.with_body do %>
    <span>And here's some amazing content. It's very engaging. Right?</span>
  <% end %>
<% end %>
```

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
