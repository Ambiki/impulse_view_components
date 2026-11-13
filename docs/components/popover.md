# Popover

A popover is a floating panel that can display rich content like navigation menus and mobile menus. Its title and
slots work as the [dialog](./dialog.md)'s do.

## Usage

```erb
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
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
| title     | N/A       | The title of the popover, which names it.                                                                                                                                                                                                                              |
| placement | `"bottom"`  | The preferred placement of the popover. The actual placement may vary to keep the element inside the viewport. One of `"top"`, `"top-start"`, `"top-end"`, `"right"`, `"right-start"`, `"right-end"`, `"bottom"`, `"bottom-start"`, `"bottom-end"`, `"left"`, `"left-start"`, or `"left-end"`. |
| strategy  | `"fixed"`   | The value of the `position` CSS property. One of `"absolute"` or `"fixed"`.                                                                                                                                                                                                |

Any other keyword arguments are passed to the `<awc-popover>` element as HTML attributes, such as `open: true` to render
it open.

## Examples

### Custom header

The header renders its block between the title and the close button.

```erb{3-5}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_header(class: "d-flex align-items-center") do %>
    <button type="button" class="btn btn-link btn-sm ml-auto">Mark all as read</button>
  <% end %>
  <% c.with_body { "Body" } %>
<% end %>
```

### Hiding the title

Hide the title with `visually_hide_title: true`. It still names the popover for assistive technology.

```erb{3}
<%= render(Impulse::PopoverComponent.new(title: "Notification settings")) do |c| %>
  <% c.with_trigger { "Notifications" } %>
  <% c.with_header(visually_hide_title: true) %>
  <% c.with_body { "Body" } %>
<% end %>
```

### Hiding the close button

Leave the close button out with `hide_close_button: true`. Escape, a click outside and focus moving out still close the
popover.

```erb{3}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_header(hide_close_button: true) %>
  <% c.with_body { "Body" } %>
<% end %>
```

With both hidden, the header shows only its block. Without a block either, the header isn't rendered, as for a
calendar in a popover.

```erb{3}
<%= render(Impulse::PopoverComponent.new(title: "Choose a date")) do |c| %>
  <% c.with_trigger { "Nov 18, 2026" } %>
  <% c.with_header(visually_hide_title: true, hide_close_button: true) %>
  <% c.with_body do %>
    <%= render(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18))) %>
  <% end %>
<% end %>
```

### Sizing the panel

The panel is at most `--awc-popover-max-width` (20rem) wide. Set it on the popover, which the panel inherits it from.

```erb{1}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed", style: "--awc-popover-max-width: 30rem")) do |c| %>
  <% c.with_trigger { "Open feed" } %>
  <% c.with_body { "Body" } %>
<% end %>
```

### Adding a form

When the block renders content of its own, such as a form, the popover renders that content instead of the `with_body`
slot. Render the body inside it with `<%= %>`.

```erb{3-7}
<%= render(Impulse::PopoverComponent.new(title: "Rename")) do |c| %>
  <% c.with_trigger { "Rename" } %>
  <%= form_with url: "#" do |f| %>
    <%= c.with_body do %>
      <%= f.text_field :name %>
    <% end %>
  <% end %>
<% end %>
```

### Closing the popover

Add the `data-action="click->awc-popover#requestHide"` attribute on the `button` element to close the popover when clicking it.

`requestHide` emits the cancelable `awc-popover:hide` event first, so a listener can keep the popover open, for example
while a form inside it has unsaved changes. `hide` closes it without asking.

```erb{4}
<%= render(Impulse::PopoverComponent.new(title: "Delete this post?")) do |c| %>
  <% c.with_trigger { "Toggle popover" } %>
  <% c.with_body do %>
    <button type="button" data-action="click->awc-popover#requestHide">Cancel</button>
  <% end %>
<% end %>
```

### Nesting popovers

You can nest as many popovers as you want and it will be stacked on top of the parent popover. A nested popover counts
as part of its parent, so moving focus or clicking into it doesn't close the parent. A click outside both, or focus
moving out of both, closes them together, the nested popover first. Escape closes the popover focus is in.

```erb{4-7}
<%= render(Impulse::PopoverComponent.new(title: "Activity feed")) do |c| %>
  <% c.with_trigger { "Open" } %>
  <% c.with_body do %>
    <%= render(Impulse::PopoverComponent.new(title: "Comments")) do |nested| %>
      <% nested.with_trigger { "Open nested popover" } %>
      <% nested.with_body { "Nested contents" } %>
    <% end %>
  <% end %>
<% end %>
```

### Loading the body

Render the body on its own with `Impulse::Popover::BodyComponent`, such as in a response that replaces it.

```erb
<%= render(Impulse::Popover::BodyComponent.new) do %>
  <%= render(@notifications) %>
<% end %>
```

## Accessibility

The popover is a non-modal dialog, rendered in the browser's [top
layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) so that no `z-index` or `overflow` can hide it.

- The panel has `role="dialog"`, labelled by its title, which is an `h2`, hidden or not. The trigger has
  `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.
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

### `with_header`

The header of the popover, which holds its title and close button.

| Name                  | Default   | Description                                                               |
| ------                | --------- | -------------                                                             |
| `visually_hide_title` | `false`   | Whether or not to hide the title, which still names the popover.          |
| `hide_close_button`   | `false`   | Whether or not to leave out the close button.                             |
| `system_args`         | `{}`      | HTML attributes for the slot's element.                                   |

### `with_body`

The body of the popover.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
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
