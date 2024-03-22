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
  dialog.show();
});
```

## Arguments

### Keyword arguments

| Name                  | Default                  | Description                                                                                                                    |
| ------                | ---------                | -------------                                                                                                                  |
| title                 | N/A                      | The title of the dialog element.                                                                                               |
| id                    | `self.class.generate_id` | The `id` of the dialog element.                                                                                                |
| size                  | `:md`                    | The `size` of the dialog element. One of `:sm`, `:md`, or `:lg`.                                                               |
| center                | `true`                   | Whether or not to center the dialog vertically.                                                                                |
| fullscreen            | `:never`                 | Whether or not to render the dialog fullscreen. One of `:never`, `:always`, `:sm_down`, `:md_down`, `:lg_down`, or `:xl_down`. |
| hide_on_outside_click | `true`                   | Whether or not to hide the dialog element when clicked outside.                                                                |

## Body

You can add any arbitrary rich content inside the body by calling the `with_body` slot.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_body do %>
    <p>Dialog body</p>
  <% end %>
<% end %>
```

## Footer

You can add a footer by calling the `with_footer` slot.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_footer do %>
    <button type="button">Submit</button>
  <% end %>
<% end %>
```

## Adding a form

There should only be one arbitrary content inside the dialog component and it should have the `awc-dialog--scrollable`
class so that only the body element can be scrolled.

```erb{2-13}
<%= render(Impulse::DialogComponent.new(title: "Edit profile")) do |c| %>
  <%= form_with url: "#", class: "awc-dialog--scrollable" do |f| %>
    <%= c.with_body do %>
      <%= f.label :name %>
      <%= f.text_field :name %>
    <% end %>
    <%= c.with_footer do %>
      <button type="reset" data-action="click->awc-dialog#hide">Cancel</button>
      <%= f.submit %>
    <% end %>
  <% end %>
<% end %>
```

If your arbitrary content comes from a partial as is the case with many `form_with` partials, you can use the
`Impulse::Dialog::BodyComponent` and `Impulse::Dialog::FooterComponent` to render the body and footer of the dialog
component respectively.

```erb{2}
<%= render(Impulse::DialogComponent.new(title: "Edit profile")) %>
  <%= render "shared/form" %>
<% end %>
```

```erb{4,8}
<%# app/views/shared/form %>

<%= form_with url: "#", class: "awc-dialog--scrollable" do |f| %>
  <%= render(Impulse::Dialog::BodyComponent.new) do %>
    <%= f.label :name %>
    <%= f.text_field :name %>
  <% end %>
  <%= render(Impulse::Dialog::FooterComponent.new) do %>
    <button type="reset" data-action="click->awc-dialog#hide">Cancel</button>
    <%= f.submit %>
  <% end %>
<% end %>
```

## Closing the dialog

Add the `data-action="click->awc-dialog#hide"` attribute on the `button` element to close the dialog when clicking it.

```erb{3}
<%= render(Impulse::DialogComponent.new(title: "Edit your profile")) do |c| %>
  <% c.with_body do %>
    <button type="button" data-action="click->awc-dialog#hide">Close</button>
  <% end %>
<% end %>
```

## Nested dialogs

You can nest as many dialogs as you want and it will be stacked on top of the parent dialog.

```erb{7-9}
<button type="button">Open dialog</button>

<%= render(Impulse::DialogComponent.new(title: "Edit your profile")) do |c| %>
  <% c.with_body do %>
    <p>Body contents...</p>
    <button type="button">Open nested dialog</button>
    <%= render(Impulse::DialogComponent.new(title: "Nested dialog", size: :sm)) do |s| %>
      <% s.with_body { "This is a nested dialog." } %>
    <% end %>
  <% end %>
<% end %>
```

## Slots

### `with_body`

The body of the dialog.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

### `with_footer`

The footer of the dialog.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/dist/elements/dialog';
```

```scss
@import '~@ambiki/impulse-view-components/dist/elements/dialog';
```
:::

## JS API
[Read here](../js-api/dialog.md).

## Ambiki teammates

You need to add `data-controller="dialog"` and provide the `id` of the dialog to the trigger element so that the users
can open it by clicking on the trigger element.

```erb{1,5}
<button type="button" data-controller="dialog" data-dialog-id-value="dialog-1">
  Open dialog
</button>

<%= render(Impulse::DialogComponent.new(id: "dialog-1", title: "My dialog")) do %>
  ...
<% end %>
```
