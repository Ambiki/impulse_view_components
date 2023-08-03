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

| Name           | Default   | Description                                                                                                                                      |
| ------         | --------- | -------------                                                                                                                                    |
| selected       | `nil`     | The `class` instance that should respond to the `value_method` and `text_method` as defined in the positional arguments.                         |
| src            | `nil`     | The endpoint to fetch the options from.                                                                                                          |
| param          | `q`       | The param that is appended when making a network request. Example: `/fruits?q=Guava`.                                                            |
| size           | `:md`     | The size of the select control. One of `:sm`, `:md`, or `:lg`.                                                                                   |
| name           | `nil`     | The name of the field. By default rails will automatically create a `name` string based on the `object_name` and `method_name`.                  |
| input_id       | `nil`     | The id of the input field.                                                                                                                       |
| placeholder    | `nil`     | The placeholder text that is displayed within the input field.                                                                                   |
| include_hidden | `true`    | See the "Gotcha" section of rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag. |
| disabled       | `false`   | Disables the select control.                                                                                                                     |
| required       | `false`   | Makes the select control a required field.                                                                                                       |
| multiple       | `false`   | Whether multiple values can be selected or not.                                                                                                  |
| clearable      | `true`    | Whether the clear button should be shown or not.                                                                                                 |

::: tip Note
The server response should include the options that matched the search query.

```erb
<%= render(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava")) %>
<%= render(Impulse::Autocomplete::OptionComponent.new(value: "kiwi", text: "Kiwi")) %>
```
:::

## Blankslate

A blankslate is displayed when the input's text does not match any of the options that are returned from the server.

```erb
<%= render(Impulse::AjaxSelectComponent.new(:post, :person_id, :id, :name, src: "/persons")) do |c| %>
  <% c.with_blankslate { "We couldn't find what you're looking for!" } %>
<% end %>
```

## Error

An error is displayed when the network request fails.

```erb
<%= render(Impulse::AjaxSelectComponent.new(:post, :person_id, :id, :name, src: "/persons")) do |c| %>
  <% c.with_error { "An error occurred. Please try again!" } %>
<% end %>
```

## Integrating with `form_with`

Wrap your `ajax_select` tag with the `impulse_form_with` method. Accepts the same [arguments](#arguments).

```erb
<%= impulse_form_with model: @user do |f| %>
  <%= f.ajax_select :fruit_id, :id, :name, selected: f.object.fruit, src: "/fruits" %>
<% end %>
```

## JS API

[Read here](../js-api/autocomplete.md).
