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
| clearable      | `true`    | Whether the clear button should be shown or not.                                                                                                 |

## Examples

### Rendering custom options

Instead of passing an array of choices to the component, you can also render the options as a block. This provides
more flexibility and you can pass any HTML attributes to it.

```erb{2-4}
<%= render(Impulse::SelectComponent.new(:post, :person_id) do |c| %>
  <% Person.all.each do |person| %>
    <% c.with_option(value: person.id, text: person.display_name, disabled: person.on_vacation?) %>
  <% end %>
<% end %>
```

### Selecting an option

You can pass the `value` of the option to the `selected` argument and it will be selected by default.

```erb{6}
<%= render(
  Impulse::SelectComponent.new(
    :user,
    :fruit_id,
    ["Apple", "Mango"],
    selected: "Mango"
  )
) %>
```

::: tip
In case of multiple select, pass an array of values to the `selected` argument, e.g. `["Apple", "Mango"]`.
:::

### Add inline attributes to options

You can optionally provide HTML attributes as the last element of the array.

```erb{5}
<%= render(
  Impulse::SelectComponent.new(
    :user,
    :country_id,
    ["Denmark", ["USA", { class: "bold", disabled: true }], "Sweden"]
  )
) %>
```

::: warning
Do not add "aria-selected" attribute to an option. If you want to select an option, pass the option's value to the
[`selected`](#selecting-an-option) argument.
:::

### Custom blankslate

A blankslate is displayed when the input's text does not match any of the options.

```erb{2}
<%= render(Impulse::SelectComponent.new(:post, :person_id, Person.all.collect { |p| [p.name, p.id] })) do |c| %>
  <% c.with_blankslate { "We could not find that person in our directory!" } %>
<% end %>
```

### Integrating with `form_with`

Wrap your `select` tag with the `impulse_form_with` method. The `f.select` tag accepts the same [arguments](#arguments).

```erb
<%= impulse_form_with model: @user do |f| %>
  <%= f.select :person_id, Person.all.collect { |p| [p.name, p.id] } %>
<% end %>
```

## Slots

### `with_option`

Customize the options by rendering a collection of the `with_option` block.

| Name          | Default   | Description                                                               |
| ------        | --------- | -------------                                                             |
| `value`       | N/A       | The value of the option.                                                  |
| `text`        | N/A       | The text of the option.                                                   |
| `system_args` | `{}`      | HTML attributes that should be passed to the Rails' `content_tag` method. |

### `with_blankslate`

Overwrite the default blankslate message by passing a custom block.

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
