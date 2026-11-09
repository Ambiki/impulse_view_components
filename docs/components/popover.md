# Popover

A popover is a floating panel that can display rich content like navigation menus and mobile menus.

## Usage

```erb
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger(class: "btn btn-primary") { "Toggle popover" } %>
  <% c.with_panel do |panel| %>
    <% panel.with_body do %>
      <span>And here's some amazing content. It's very engaging. Right?</span>
    <% end %>
  <% end %>
<% end %>
```

## Arguments

### Keyword arguments

| Name      | Default   | Description                                                                                                                                                                                                                                                            |
| ------    | --------- | -------------                                                                                                                                                                                                                                                          |
| placement | `"bottom"`  | The preferred placement of the popover. The actual placement may vary to keep the element inside the viewport. One of `"top"`, `"top-start"`, `"top-end"`, `"right"`, `"right-start"`, `"right-end"`, `"bottom"`, `"bottom-start"`, `"bottom-end"`, `"left"`, `"left-start"`, or `"left-end"`. |
| strategy  | `"fixed"`   | The value of the `position` CSS property. One of `"absolute"` or `"fixed"`.                                                                                                                                                                                                |

Any other keyword arguments are passed to the `<awc-popover>` element as HTML attributes, such as `open: true` to render
it open.

## Examples

### Adding a title

Add a title with the header's `with_title` slot. It names the popover, and a close button follows it.

```erb{4-6}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_panel do |panel| %>
    <% panel.with_header do |header| %>
      <% header.with_title { "Activity feed" } %>
    <% end %>
    <% panel.with_body { "Body" } %>
  <% end %>
<% end %>
```

### Custom header

The header renders its block between the title and the close button.

```erb{4-7}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_panel do |panel| %>
    <% panel.with_header(class: "d-flex align-items-center") do |header| %>
      <% header.with_title { "Activity feed" } %>
      <button type="button" class="btn btn-link btn-sm ml-auto">Mark all as read</button>
    <% end %>
    <% panel.with_body { "Body" } %>
  <% end %>
<% end %>
```

Without a title, the header renders only its block, and the trigger names the popover.

### Sizing the panel

`with_panel` passes its arguments to the panel. The panel is at most Bootstrap's `$popover-max-width` wide. Set a
fixed width with a class: the popover clears an inline `width` when it positions the panel.

```erb{3}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_panel(style: "max-width: 20rem") do |panel| %>
    <% panel.with_body { "Body" } %>
  <% end %>
<% end %>
```

### Adding a form

When the panel's block renders content of its own, such as a form, the panel renders that content instead of the
`with_body` slot. Render the body inside it with `<%= %>`.

```erb{4-8}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Rename" } %>
  <% c.with_panel do |panel| %>
    <%= form_with url: "#" do |f| %>
      <%= panel.with_body do %>
        <%= f.text_field :name %>
      <% end %>
    <% end %>
  <% end %>
<% end %>
```

### Closing the popover

Add the `data-action="click->awc-popover#requestHide"` attribute on the `button` element to close the popover when clicking it.

`requestHide` emits the cancelable `awc-popover:hide` event first, so a listener can keep the popover open, for example
while a form inside it has unsaved changes. `hide` closes it without asking.

```erb{5}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_panel do |panel| %>
    <% panel.with_body do %>
      <button type="button" data-action="click->awc-popover#requestHide">Close</button>
    <% end %>
  <% end %>
<% end %>
```

### Nesting popovers

You can nest as many popovers as you want and it will be stacked on top of the parent popover. A nested popover counts
as part of its parent, so moving focus or clicking into it doesn't close the parent. A click outside both, or focus
moving out of both, closes them together, the nested popover first. Escape closes the popover focus is in.

```erb{5-10}
<%= render(Impulse::PopoverComponent.new) do |c| %>
  <% c.with_trigger { "Open" } %>
  <% c.with_panel do |panel| %>
    <% panel.with_body do %>
      <%= render(Impulse::PopoverComponent.new) do |nested| %>
        <% nested.with_trigger { "Open nested popover" } %>
        <% nested.with_panel do |nested_panel| %>
          <% nested_panel.with_body { "Nested contents" } %>
        <% end %>
      <% end %>
    <% end %>
  <% end %>
<% end %>
```

## Accessibility

The popover is a non-modal dialog, rendered in the browser's [top
layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) so that no `z-index` or `overflow` can hide it.

- The panel has `role="dialog"`, labelled by the header's title, or by the trigger when there is no title. The
  trigger has `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.
- Opening it moves focus into the popover: to the element with `autofocus`, else the first element you can Tab to,
  else the popover itself. A popover rendered open doesn't take focus.
- Escape, a click outside, and focus moving out of the popover, such as Tab past its last element, all ask it to close.
- Closing it returns focus to the trigger when focus was inside the popover, or lost. When focus has moved on to
  something else, such as a field clicked outside, it stays there.
- Closing it closes the popovers nested in it first. A user action asks them first, and one that refuses keeps the
  popover open.

## Slots

### `with_trigger`

The trigger, a `<button>` that shows or hides the popover. Required: the popover renders nothing without it.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

### `with_panel`

The panel, the dialog the trigger shows. Add its parts with `with_header` and `with_body`.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

### `panel.with_header`

The header of the panel. Add its title with `with_title`.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

### `header.with_title`

The title of the panel, which names it.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `tag`         | `:span`   | The name of the HTML tag.                                                 |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

### `panel.with_body`

The body of the panel.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `tag`         | `:div`    | The name of the HTML tag.                                                 |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/popover';
```

```scss
@import '@ambiki/impulse-view-components/popover';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/popover.md).
