# Select

Select allows a user to filter through a list of pre-defined sets of options and select one or multiple values.

## Usage

```erb
<%= render(Impulse::SelectComponent.new(:post, :person_id, Person.all.collect { |p| [p.name, p.id] })) %>
```

## Arguments

### Positional arguments

| Name        | Default   | Description                                                                                                                                                                      |
| ------      | --------- | -------------                                                                                                                                                                    |
| object_name | N/A       | The name of the object.                                                                                                                                                          |
| method_name | N/A       | The name of the method.                                                                                                                                                          |
| choices     | `[]`      | An array of choices similar to how you would pass to native rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag. |

### Keyword arguments

| Name           | Default   | Description                                                                                                                                      |
| ------         | --------- | -------------                                                                                                                                    |
| selected       | `nil`     | The `value` of the option that you want to force select.                                                                                         |
| size           | `:md`     | The size of the select control. One of `:sm`, `:md`, or `:lg`.                                                                                   |
| name           | `nil`     | The name of the field. By default rails will automatically create a `name` string based on the `object_name` and `method_name`.                  |
| input_id       | `nil`     | The id of the input field.                                                                                                                       |
| placeholder    | `nil`     | The placeholder text that is displayed within the input field.                                                                                   |
| include_hidden | `true`    | See the "Gotcha" section of rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag. |
| disabled       | `false`   | Disables the select control.                                                                                                                     |
| required       | `false`   | Makes the select control a required field.                                                                                                       |
| multiple       | `false`   | Whether multiple values can be selected or not.                                                                                                  |

## Blankslate

A blankslate is displayed when the input's text does not match any of the options.

```erb
<%= render(Impulse::SelectComponent.new(:post, :person_id, Person.all.collect { |p| [p.name, p.id] })) do |c| %>
  <% c.with_blankslate { "We couldn't find what you're looking for!" } %>
<% end %>
```

## Integrating with `form_with`

Wrap your `select` tag with the `impulse_form_with` method. Accepts the same [arguments](#arguments).

```erb
<%= impulse_form_with model: @user do |f| %>
  <%= f.select :person_id, Person.all.collect { |p| [p.name, p.id] } %>
<% end %>
```
