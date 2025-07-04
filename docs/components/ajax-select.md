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
| value_method | N/A       | The name of the method that the `selected` argument responds to. |
| text_method  | N/A       | The name of the method that the `selected` argument responds to. |

### Keyword arguments

| Name              | Default   | Description                                                                                                                                       |
| ------            | --------- | -------------                                                                                                                                     |
| selected          | `nil`     | The `class` instance that should respond to the `value_method` and `text_method` as defined in the positional arguments.                          |
| src               | `nil`     | The endpoint to fetch the options from.                                                                                                           |
| param             | `q`       | The param that is appended when making a network request. Example: `/fruits?q=Guava`.                                                             |
| size              | `md`      | The size of the select control. One of `sm`, `md`, or `lg`.                                                                                       |
| name              | `nil`     | The name of the field. By default rails will automatically create a `name` string based on the `object_name` and `method_name`.                   |
| input_id          | `nil`     | The id of the input field.                                                                                                                        |
| placeholder       | `nil`     | The placeholder text that is displayed within the input field.                                                                                    |
| include_hidden    | `true`    | See the "Gotcha" section of rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag.  |
| disabled          | `false`   | Disables the select control.                                                                                                                      |
| required          | `false`   | Makes the select control a required field.                                                                                                        |
| multiple          | `false`   | Whether multiple values can be selected or not.                                                                                                   |
| clearable         | `true`    | Whether the clear button should be shown or not.                                                                                                  |
| auto_size         | `true`    | If `true`, the listbox will automatically adjust its height based on its content. This helps avoid scrollbars by fitting the content dynamically. |
| auto_size_padding | `4`       | The number of pixels of extra space to add beyond the content's height when `auto_size` is enabled. Acts as vertical padding.                     |

::: tip Note
The server response should include the options that matched the search query.

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
    selected: OpenStruct.new(id: 1, name: "John Doe")
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
  <% c.with_error { "An error occurred. Please try again!" } %>
<% end %>
```

### Integrating with `form_with`

Wrap your `ajax_select` tag with the `impulse_form_with` method. The `f.ajax_select` tag accepts the same
[arguments](#arguments).

```erb
<%= impulse_form_with model: @user do |f| %>
  <%= f.ajax_select :fruit_id, :id, :name, selected: f.object.fruit, src: "/fruits" %>
<% end %>
```

## Slots

### `with_blankslate`

Overwrite the default blankslate message by passing a custom block.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

### `with_error`

Overwrite the default error message by passing a custom block.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

## Imports

::: code-group
```js
import '@ambiki/impulse-view-components/dist/elements/autocomplete';
```

```scss
@import '~@ambiki/impulse-view-components/dist/elements/autocomplete';
```
:::

## JS API

[Read here](../js-api/autocomplete.md).
