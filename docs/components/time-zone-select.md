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
| priority_zones | `nil`     | The time zones listed above the rest: an array of zones, or a `Regexp` that each zone is matched against. |

### Keyword arguments

| Name                 | Default                   | Description                                                                                                                                                                                                                                      |
| ------               | ---------                 | -------------                                                                                                                                                                                                                                    |
| selected             | `nil`                     | The `value` of the option that you want to force select.                                                                                                                                                                                         |
| default              | `nil`                     | The `value` of the option that you want to select if the `selected` is `nil`.                                                                                                                                                                    |
| model                | `ActiveSupport::TimeZone` | Where the zones come from: an object whose `all` returns them. Each zone must respond to `name` (the option's value) and `to_s` (its text), and to `match?` when `priority_zones` is a `Regexp`. |
| priority_zones_title | `"Prioritized time zones"` | The title of the group of time zones that have been prioritized.                                                                                                                                                                                 |
| size                 | `:md`                     | The size of the select control. One of `:sm`, `:md`, or `:lg`.                                                                                                                                                                                   |
| name                 | `nil`                     | The name of the field. By default, Rails automatically creates a `name` string based on the `object_name` and `method_name`.                                                                                                                     |
| input_id             | `nil`                     | The id of the input field.                                                                                                                                                                                                                       |
| placeholder          | `nil`                     | The placeholder text that is displayed within the input field.                                                                                                                                                                                   |
| include_hidden       | `true`                    | Only applies to a `multiple` select. See the "Gotcha" section of the Rails [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormOptionsHelper.html#method-i-select) tag.                                                                                             |
| disabled             | `false`                   | Disables the select control.                                                                                                                                                                                                                     |
| required             | `false`                   | Makes the select control a required field.                                                                                                                                                                                                       |
| multiple             | `false`                   | Whether multiple values can be selected or not.                                                                                                                                                                                                  |
| clearable            | `true`                    | Whether the clear button should be shown or not.                                                                                                                                                                                                 |
| auto_size            | `true`                    | If `true`, caps the listbox's height to the space between it and the edge of the viewport, so a long list scrolls instead of running off screen.                                                                                                 |
| auto_size_padding    | `4`                       | The space in pixels to keep between the listbox and the edge of the viewport when `auto_size` is enabled.                                                                                                                                        |

Any other keyword arguments are passed to the `<awc-autocomplete>` element as HTML attributes.

## Examples

### Prioritizing zones

Pass an array of [`ActiveSupport::TimeZone`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html),
[`ActiveSupport::TimeZone.us_zones`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html#method-c-us_zones)
for a list of US time zones, [`ActiveSupport::TimeZone.country_zones(country_code)`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html#method-c-country_zones)
for another country’s time zones, or a [`Regexp`](https://docs.ruby-lang.org/en/master/Regexp.html) to select the zones
of your choice. The rest are listed after them, under "Other".

```erb
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.us_zones)) %>
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, [ActiveSupport::TimeZone["Alaska"], ActiveSupport::TimeZone["Hawaii"]])) %>
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, /Australia/)) %>
```

### Custom blankslate

A blankslate is displayed when the input's text does not match any of the options.

```erb{2}
<%= render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone)) do |c| %>
  <% c.with_blankslate { "We could not find that time zone in our directory!" } %>
<% end %>
```

### Integrating with `form_with`

Wrap your `time_zone_select` tag with the `impulse_form_with` method. The `f.time_zone_select` tag accepts the same [arguments](#arguments),
and selects the attribute's value unless you pass `selected`. `default` applies when the attribute is `nil`.

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

Overwrite the default blankslate message by passing a block. It takes no arguments.

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
