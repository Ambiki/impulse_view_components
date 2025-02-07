# Time zone select

Time zone select allows a user to filter through a list of default time zones and select one or multiple values.

## Usage

```erb
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone)) %>
```

## Arguments

### Positional arguments

| Name           | Default   | Description                                                                  |
| ------         | --------- | -------------                                                                |
| object_name    | N/A       | The name of the object.                                                      |
| method_name    | N/A       | The name of the method.                                                      |
| priority_zones | `nil`     | A list of time zones that will be listed above the rest of the (long) list. |

### Keyword arguments

| Name                 | Default                   | Description                                                                                                                                                                                                                                      |
| ------               | ---------                 | -------------                                                                                                                                                                                                                                    |
| selected             | `nil`                     | The `value` of the option that you want to force select.                                                                                                                                                                                         |
| default              | `nil`                     | The `value` of the option that you want to select if the `selected` is `nil`.                                                                                                                                                                    |
| model                | `ActiveSupport::TimeZone` | A list of time zones that should respond to `all` and return an array of objects that represent time zones; each object must respond to `name` and `to_s`. If a `Regexp` is given, it will attempt to match the zones using the `match?` method. |
| priority_zones_title | "Prioritized time zones"  | The title of the group of time zones that have been prioritized.                                                                                                                                                                                 |
| size                 | `md`                      | The size of the select control. One of `sm`, `md`, or `lg`.                                                                                                                                                                                      |
| name                 | `nil`                     | The name of the field. By default rails will automatically create a `name` string based on the `object_name` and `method_name`.                                                                                                                  |
| input_id             | `nil`                     | The id of the input field.                                                                                                                                                                                                                       |
| placeholder          | `nil`                     | The placeholder text that is displayed within the input field.                                                                                                                                                                                   |
| include_hidden       | `true`                    | See the "Gotcha" section of rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag.                                                                                                 |
| disabled             | `false`                   | Disables the select control.                                                                                                                                                                                                                     |
| required             | `false`                   | Makes the select control a required field.                                                                                                                                                                                                       |
| multiple             | `false`                   | Whether multiple values can be selected or not.                                                                                                                                                                                                  |
| clearable            | `true`                    | Whether the clear button should be shown or not.                                                                                                                                                                                                 |

## Examples

### Prioritizing zones

You can also supply an array of [`ActiveSupport::TimeZone`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html),
[`ActiveSupport::TimeZone.us_zones`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html#method-c-us_zones)
for a list of US time zones, [`ActiveSupport::TimeZone.country_zones(country_code)`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html#method-c-country_zones)
for another country’s time zones or a [`Regexp`](https://api.rubyonrails.org/classes/Regexp.html) to select the zones
of your choice.

```erb
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.us_zones)) %>
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, [ActiveSupport::TimeZone["Alaska"], ActiveSupport::TimeZone["Hawaii"]])) %>
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, /Australia/)) %>
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.all.sort)) %>
```

### Custom blankslate

A blankslate is displayed when the input's text does not match any of the options.

```erb{2}
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone)) do |c| %>
  <% c.with_blankslate { "We could not find that time zone in our directory!" } %>
<% end %>
```

### Integrating with `form_with`

Wrap your `time_zone_select` tag with the `impulse_form_with` method. The `f.time_zone_select` tag accepts the same [arguments](#arguments).

```erb
<%= impulse_form_with model: @user do |f| %>
  <%= f.time_zone_select :time_zone %>
<% end %>

<%= impulse_form_with model: @user do |f| %>
  <%= f.time_zone_select :time_zone, ActiveSupport::TimeZone.us_zones %>
<% end %>

<%= impulse_form_with model: @user do |f| %>
  <%= f.time_zone_select :time_zone, nil, default: "Hawaii" %>
<% end %>

<%= impulse_form_with model: @user do |f| %>
  <%= f.time_zone_select :time_zone do |c| %>
    <% c.with_blankslate { "Time zone not found!" } %>
  <% end %>
<% end %>
```

## Slots

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
