# Ajax select

Ajax select allows users to fetch a list of options from the server.

## Usage

```erb
<%= render(Impulse::AjaxSelectComponent.new(:post, :person_id, :id, :name, src: "/users")) %>
```

## Arguments

### Positional arguments

| Name         | Default   | Description                                                      |
| ------       | --------- | -------------                                                    |
| object_name  | N/A       | The name of the object.                                          |
| method_name  | N/A       | The name of the method.                                          |
| value_method | N/A       | The method called on the `selected` object to read each option's value (e.g. `:id`).        |
| text_method  | N/A       | The method called on the `selected` object to read each option's display text (e.g. `:name`). |

### Keyword arguments

| Name              | Default   | Description                                                                                                                                       |
| ------            | --------- | -------------                                                                                                                                     |
| selected          | `nil`     | An object that responds to `value_method` and `text_method`, or an array of them for a `multiple` select.                                         |
| src               | N/A       | The endpoint to fetch the options from.                                                                                                           |
| param             | `"q"`     | The param that is appended when making a network request. Example: `/fruits?q=Guava`.                                                             |
| size              | `:md`     | The size of the select control. One of `:sm`, `:md`, or `:lg`.                                                                                    |
| name              | `nil`     | The name of the field. By default, Rails automatically creates a `name` string based on the `object_name` and `method_name`.                      |
| input_id          | `nil`     | The id of the input field.                                                                                                                        |
| placeholder       | `nil`     | The placeholder text that is displayed within the input field.                                                                                    |
| include_hidden    | `true`    | Only applies to a `multiple` select. See the "Gotcha" section of the Rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag. |
| disabled          | `false`   | Disables the select control.                                                                                                                      |
| required          | `false`   | Makes the select control a required field.                                                                                                        |
| multiple          | `false`   | Whether multiple values can be selected or not.                                                                                                   |
| clearable         | `true`    | Whether the clear button should be shown or not.                                                                                                  |
| auto_size         | `true`    | If `true`, caps the listbox's height to the space between it and the edge of the viewport, so a long list scrolls instead of running off screen.  |
| auto_size_padding | `4`       | The space in pixels to keep between the listbox and the edge of the viewport when `auto_size` is enabled.                                         |

Any other keyword arguments are passed to the `<awc-autocomplete>` element as HTML attributes, except `index`,
`namespace`, `skip_default_ids` and `allow_method_names_outside_object`, which are passed to the Rails field helpers.

::: tip Note
The endpoint receives the search text in `param`, such as `/fruits?q=gu`, and `?q=` when the listbox first opens. It
responds with the HTML of the matching options. The request sends `Accept: text/fragment+html`, and a response that
isn't 2xx shows the [error](#custom-error).

```erb
<%= render(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava")) %>
<%= render(Impulse::Autocomplete::OptionComponent.new(value: "kiwi", text: "Kiwi")) %>
```

The `Impulse::Autocomplete::OptionComponent` also takes an optional `description` argument.
```erb
<%= render(Impulse::Autocomplete::OptionComponent.new(value: "kiwi", text: "Kiwi", description: "This is a fruit.")) %>
```
:::

## Examples

### Selecting an option

Pass an object that responds to the `value_method` and the `text_method`.

```erb{8}
<%= render(
  Impulse::AjaxSelectComponent.new(
    :post,
    :person_id,
    :id,
    :name,
    src: "/persons",
    selected: Person.find(1)
  )
) %>
```

::: tip
In case of multiple select, pass an array of objects to the `selected` argument.
:::

### Custom blankslate

A blankslate is displayed when the input's text does not match any of the options that are returned from the server.

```erb
<%= render(Impulse::AjaxSelectComponent.new(:post, :person_id, :id, :name, src: "/persons")) do |c| %>
  <% c.with_blankslate { "We couldn't find what you're looking for!" } %>
<% end %>
```

### Custom error

An error is displayed when the network request fails.

```erb
<%= render(Impulse::AjaxSelectComponent.new(:post, :person_id, :id, :name, src: "/persons")) do |c| %>
  <% c.with_error { "We couldn't load the people. Please try again!" } %>
<% end %>
```

### Integrating with `form_with`

Wrap your `ajax_select` tag with the `impulse_form_with` method. The `f.ajax_select` tag accepts the same
[arguments](#arguments). Unlike `f.select`, it doesn't read the selection from the object, so pass `selected`.

```erb
<%= impulse_form_with model: @user do |f| %>
  <%= f.ajax_select :fruit_id, :id, :name, selected: f.object.fruit, src: "/fruits" %>
<% end %>
```

### Translations

The ajax select shares the select's blankslate, `impulse.autocomplete.blankslate` (see
[Translations](./select.md#translations)), and adds its error:

```yaml
en:
  impulse:
    autocomplete:
      error: An error occurred. Please try again!
```

## Slots

### `with_blankslate`

Overwrite the default blankslate message by passing a block. It takes no arguments.

### `with_error`

Overwrite the default error message by passing a block. It takes no arguments.

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/autocomplete';
```

```scss
@import '@ambiki/impulse-view-components/autocomplete';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/autocomplete.md).
