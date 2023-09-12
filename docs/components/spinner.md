# Spinner

Indicate the loading state of a component or a page.

## Usage

```erb
<%= render(Impulse::SpinnerComponent.new) %>
```

## Arguments


| Name    | Default     | Description                                                                                                          |
| ------  | ---------   | -------------                                                                                                        |
| variant | `secondary` | The color of the spinner. One of `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, or `dark`. |
| label   | `Loading`   | The accessible text that describes the current state of the component or a page.                                     |

## Examples

### Changing the color

Set one of the accepted variants as the `variant` argument.

```erb
<%= render(Impulse::SpinnerComponent.new(variant: :primary)) %>
<%= render(Impulse::SpinnerComponent.new(variant: :danger)) %>
<%= render(Impulse::SpinnerComponent.new(variant: :info)) %>
```
