# Sheet

A sheet is a modal dialog pinned to the right edge of the viewport and filling its height. It renders the dialog's
`<awc-dialog>` element, so it opens, closes and traps focus as a [dialog](./dialog.md) does. Only its layout differs.

## Usage

```erb
<button type="button">Open sheet</button>

<%= render(Impulse::SheetComponent.new(title: "Alerts")) do |c| %>
  <% c.with_body { "Sheet body" } %>
<% end %>
```

```js
const button = document.querySelector('button');
const sheet = document.querySelector('awc-dialog');
button.addEventListener('click', () => {
  sheet.requestShow();
});
```

## Arguments

### Keyword arguments

| Name                  | Default                  | Description                                                                                                                   |
| ------                | ---------                | -------------                                                                                                                 |
| title                 | N/A                      | The title of the sheet, which names it.                                                                                       |
| id                    | `self.class.generate_id` | The `id` of the `<awc-dialog>` element.                                                                                       |
| fullscreen            | `:never`                 | Whether or not to render the sheet fullscreen. One of `:never`, `:always`, `:sm_down`, `:md_down`, `:lg_down`, or `:xl_down`. |
| hide_on_outside_click | `true`                   | Whether a press outside the sheet, released outside it, hides it.                                                             |

Any other keyword arguments are passed to the `<awc-dialog>` element as HTML attributes.

## Examples

### Footer

```erb{2-4}
<%= render(Impulse::SheetComponent.new(title: "Filters")) do |c| %>
  <% c.with_footer do %>
    <button type="button" data-action="click->awc-dialog#requestHide">Done</button>
  <% end %>
<% end %>
```

### Adding a form

As in a dialog, content of its own, such as a form, renders instead of the `with_body` and `with_footer` slots. Give
the element that wraps them the `awc-dialog--scrollable` class, so that only the body scrolls. A partial that renders
`Impulse::Dialog::BodyComponent` and `Impulse::Dialog::FooterComponent` works in a sheet too.

```erb{2-10}
<%= render(Impulse::SheetComponent.new(title: "Edit profile")) do |c| %>
  <%= form_with url: "#", class: "awc-dialog--scrollable" do |f| %>
    <%= c.with_body do %>
      <%= f.label :name %>
      <%= f.text_field :name %>
    <% end %>
    <%= c.with_footer do %>
      <%= f.submit %>
    <% end %>
  <% end %>
<% end %>
```

### Width

A sheet is `--awc-sheet-width` (400px) wide, and at most 92% of the viewport, so a strip of the page stays visible to
click on phones.

```erb
<%= render(Impulse::SheetComponent.new(title: "Alerts", style: "--awc-sheet-width: 600px")) %>
```

### Fullscreen

`fullscreen: :sm_down` makes the sheet fill the screen below the `sm` breakpoint.

```erb
<%= render(Impulse::SheetComponent.new(title: "Alerts", fullscreen: :sm_down)) %>
```

## Slots

A sheet has the dialog's slots: [`with_header`](./dialog.md#with-header), [`with_body`](./dialog.md#with-body) and
[`with_footer`](./dialog.md#with-footer).

## Imports

A sheet uses the dialog's JavaScript and styles.

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

A sheet is an `<awc-dialog>`. [Read here](../js-api/dialog.md).
