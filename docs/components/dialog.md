# Dialog

Dialog uses the native HTML `<dialog>` element under the hood which provides full accessibility out of the box.

## Usage

```erb
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_trigger { "Open dialog" } %>
  <% c.with_body { "Dialog body" } %>
<% end %>
```

## Arguments

### Keyword arguments

| Name                  | Default                  | Description                                                                                                                    |
| ------                | ---------                | -------------                                                                                                                  |
| title                 | `nil`                    | The title of the dialog element.                                                                                               |
| id                    | `self.class.generate_id` | The `id` of the dialog element.                                                                                                |
| size                  | `:md`                    | The `size` of the dialog element. One of `:sm`, `:md`, or `:lg`.                                                               |
| fullscreen            | `:never`                 | Whether or not to render the dialog fullscreen. One of `:never`, `:always`, `:sm_down`, `:md_down`, `:lg_down`, or `:xl_down`. |
| hide_on_outside_click | `true`                   | Whether or not to hide the dialog element when clicked outside.                                                                |

## Header

```erb
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_trigger { "Open dialog" } %>
  <% c.with_header do %>
    <button type="button">Header button</button>
  <% end %>
<% end %>
```

::: tip Note
You should not use the `with_header` slot if you just want to change the `title` of the dialog element. Instead, pass
the `title` argument directly to the component.
:::

## Body

```erb
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_trigger { "Open dialog" } %>
  <% c.with_body do %>
    <p>Dialog body</p>
  <% end %>
<% end %>
```

## Footer

```erb
<%= render(Impulse::DialogComponent.new(title: "My dialog")) do |c| %>
  <% c.with_trigger { "Open dialog" } %>
  <% c.with_footer do %>
    <button type="button">Submit</button>
  <% end %>
<% end %>
```

## Form

You can render any arbitrary content inside the dialog and use the `Impulse::Dialog::BodyComponent` and
`Impulse::Dialog::FooterComponent` to render the HTML with the correct styles.

```erb
<%= render(Impulse::DialogComponent.new(title: "Edit profile")) do |c| %>
  <% c.with_trigger { "Edit profile" } %>
  <form class="awc-dialog-body-container">
    <%= render(Impulse::Dialog::BodyComponent.new) do %>
      <div>
        <label for="name">Full name</label>
        <input type="text" id="name">
      </div>
    <% end %>
    <%= render(Impulse::Dialog::FooterComponent.new) do %>
      <button type="reset" data-action="click->awc-dialog#hide">Cancel</button>
      <button type="submit">Submit</button>
    <% end %>
  </form>
<% end %>
```

## Nested dialog

```erb
<%= render(Impulse::DialogComponent.new(title: "Edit your profile")) do |c| %>
  <% c.with_trigger { "Edit profile" } %>
  <% c.with_body do %>
    <p>Body contents...</p>

    <div>
      <%= render(Impulse::DialogComponent.new(title: "Nested dialog", size: :sm)) do |s| %>
        <% s.with_trigger { "Open nested dialog" } %>
        <% s.with_body { "This is a nested dialog." } %>
        <% s.with_footer do %>
          <button type="button" data-action="click->awc-dialog#hide">Close</button>
        <% end %>
      <% end %>
    </div>
  <% end %>
<% end %>
```

## Closing the dialog

Add the `data-action="click->awc-dialog#hide"` attribute on the `button` element to close the closest parent dialog.

```erb{4}
<%= render(Impulse::DialogComponent.new(title: "Edit your profile")) do |c| %>
  <% c.with_trigger { "Edit profile" } %>
  <% c.with_body do %>
    <button type="button" data-action="click->awc-dialog#hide">Close</button>
  <% end %>
<% end %>
```
