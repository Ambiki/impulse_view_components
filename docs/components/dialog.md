# Dialog

Dialog uses the native HTML `<dialog>` element under the hood which provides full accessibility out of the box and
solves z-index issues by rendering the element in the [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer).

## Usage

```erb
<button type="button">Open dialog</button>

<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_body { "Dialog body" } %>
<% end %>
```

```js
const button = document.querySelector('button');
const dialog = document.querySelector('awc-dialog');
button.addEventListener('click', () => {
  dialog.requestShow();
});
```

## Arguments

### Keyword arguments

| Name                  | Default                  | Description                                                                                                                    |
| ------                | ---------                | -------------                                                                                                                  |
| title                 | N/A                      | The title of the dialog element, which names it.                                                                               |
| id                    | `self.class.generate_id` | The `id` of the dialog element.                                                                                                |
| size                  | `:md`                    | The `size` of the dialog element. One of `:sm`, `:md`, or `:lg`.                                                               |
| center                | `true`                   | Whether or not to center the dialog vertically.                                                                                |
| fullscreen            | `:never`                 | Whether or not to render the dialog fullscreen. One of `:never`, `:always`, `:sm_down`, `:md_down`, `:lg_down`, or `:xl_down`. |
| hide_on_outside_click | `true`                   | Whether or not to hide the dialog element when clicked outside.                                                                |

Any other keyword arguments are passed to the `<awc-dialog>` element as HTML attributes.

## Examples

### Body

You can add any arbitrary rich content inside the body by calling the `with_body` slot.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_body do %>
    <p>Dialog body</p>
  <% end %>
<% end %>
```

### Footer

You can add a footer by calling the `with_footer` slot.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_footer do %>
    <button type="button">Submit</button>
  <% end %>
<% end %>
```

### Custom header

The header renders its block between the title and the close button.

```erb{2-4}
<%= render(Impulse::DialogComponent.new(title: "Edit profile")) do |c| %>
  <% c.with_header(class: "align-items-center") do %>
    <span class="badge badge-secondary">Draft</span>
  <% end %>
  <% c.with_body { "Dialog body" } %>
<% end %>
```

### Hiding the title

Hide the title with `visually_hide_title: true`, such as when a search field takes its place. It still names the
dialog for assistive technology.

```erb{2-4}
<%= render(Impulse::DialogComponent.new(title: "Command palette")) do |c| %>
  <% c.with_header(visually_hide_title: true) do %>
    <input type="search" placeholder="Search or jump to..." aria-label="Search or jump to">
  <% end %>
  <% c.with_body { "Dialog body" } %>
<% end %>
```

### Hiding the close button

Leave the close button out with `hide_close_button: true`. Escape and a click outside still close the dialog. Give it
another button that closes it, [as below](#closing-the-dialog), when `hide_on_outside_click` is off.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "Delete project")) do |c| %>
  <% c.with_header(hide_close_button: true) %>
  <% c.with_footer do %>
    <button type="button" data-action="click->awc-dialog#requestHide">Cancel</button>
  <% end %>
<% end %>
```

A header with nothing to show, with its title and close button both hidden and no block, isn't rendered.

### Adding a form

When the block renders content of its own, such as a form, the dialog renders that content instead of the `with_body`
and `with_footer` slots. Render the slots inside it with `<%= %>`, and give the element that wraps them the
`awc-dialog--scrollable` class, so that only the body scrolls.

```erb{2-11}
<%= render(Impulse::DialogComponent.new(title: "Edit profile")) do |c| %>
  <%= form_with url: "#", class: "awc-dialog--scrollable" do |f| %>
    <%= c.with_body do %>
      <%= f.label :name %>
      <%= f.text_field :name %>
    <% end %>
    <%= c.with_footer do %>
      <button type="reset" data-action="click->awc-dialog#requestHide">Cancel</button>
      <%= f.submit %>
    <% end %>
  <% end %>
<% end %>
```

If your arbitrary content comes from a partial as is the case with many `form_with` partials, you can use the
`Impulse::Dialog::BodyComponent` and `Impulse::Dialog::FooterComponent` to render the body and footer of the dialog
component respectively.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "Edit profile")) do %>
  <%= render "shared/form" %>
<% end %>
```

```erb{4,8}
<%# app/views/shared/_form.html.erb %>

<%= form_with url: "#", class: "awc-dialog--scrollable" do |f| %>
  <%= render(Impulse::Dialog::BodyComponent.new) do %>
    <%= f.label :name %>
    <%= f.text_field :name %>
  <% end %>
  <%= render(Impulse::Dialog::FooterComponent.new) do %>
    <button type="reset" data-action="click->awc-dialog#requestHide">Cancel</button>
    <%= f.submit %>
  <% end %>
<% end %>
```

### Closing the dialog

Add the `data-action="click->awc-dialog#requestHide"` attribute on the `button` element to close the dialog when clicking it.

`requestHide` emits the cancelable `awc-dialog:hide` event first, so a listener can keep the dialog open, for example
while a form inside it has unsaved changes. `hide` closes it without asking.

```erb{3}
<%= render(Impulse::DialogComponent.new(title: "Edit your profile")) do |c| %>
  <% c.with_body do %>
    <button type="button" data-action="click->awc-dialog#requestHide">Close</button>
  <% end %>
<% end %>
```

### Nested dialogs

You can nest as many dialogs as you want and it will be stacked on top of the parent dialog.

```erb{7-9}
<button type="button">Open dialog</button>

<%= render(Impulse::DialogComponent.new(title: "Edit your profile")) do |c| %>
  <% c.with_body do %>
    <p>Body contents...</p>
    <button type="button">Open nested dialog</button>
    <%= render(Impulse::DialogComponent.new(title: "Nested dialog", size: :sm)) do |nested| %>
      <% nested.with_body { "This is a nested dialog." } %>
    <% end %>
  <% end %>
<% end %>
```

## Slots

### `with_header`

The header of the dialog, which holds its title and close button.

| Name                  | Default   | Description                                                               |
| ------                | --------- | -------------                                                             |
| `visually_hide_title` | `false`   | Whether or not to hide the title, which still names the dialog.           |
| `hide_close_button`   | `false`   | Whether or not to leave out the close button.                             |
| `system_args`         | `{}`      | HTML attributes for the slot's element.                                   |

### `with_body`

The body of the dialog.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

### `with_footer`

The footer of the dialog.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes for the slot's element.                                   |

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/dialog';
```

```scss
@import '@ambiki/impulse-view-components/dialog';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/dialog.md).
