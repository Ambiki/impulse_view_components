# Getting started

## Install the gem

Add the gem to your `Gemfile`:

```rb
gem "impulse_view_components"
```

Then install it:

```bash
bundle install
```

## Mount the engine

Require the engine in `config/application.rb`:

```rb
require "impulse/view_components/engine"
```

## Install the JavaScript package

The interactive components ship as custom elements, so you also need the npm package. It depends on
[`@ambiki/impulse`](https://github.com/Ambiki/impulse), which is installed automatically as a
dependency.

```bash
yarn add @ambiki/impulse-view-components
```

## Import the components

Each component is imported individually for both JavaScript and styles, so you only ship what you use.
For example, to use the [Select](/components/select) component:

```js
import '@ambiki/impulse-view-components/autocomplete';
```

To register every component at once, import the package itself:

```js
import '@ambiki/impulse-view-components';
```

```scss
@import '~@ambiki/impulse-view-components/dist/elements/autocomplete';
```

See the **Imports** section on each component's page for the exact paths.

## Upgrading from `dist/` paths

Paths that start with `@ambiki/impulse-view-components/dist/` are deprecated. They keep working, but the docs now
use the shorter paths below.

| Deprecated path                                                  | Use instead                                                                    |
|------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `…/dist/index.js`                                                | `@ambiki/impulse-view-components`                                              |
| `…/dist/elements/<name>`, `…/dist/elements/<name>/index.js`      | `@ambiki/impulse-view-components/<name>`, such as `…/popover`                  |
| `import useFloatingUI from '…/dist/hooks/use_floating_ui'`       | `import { useFloatingUI } from '@ambiki/impulse-view-components/hooks'`        |
| `import useFocusOut from '…/dist/hooks/use_focus_out'`           | `import { useFocusOut } from '@ambiki/impulse-view-components/hooks'`          |
| `import useOutsideClick from '…/dist/hooks/use_outside_click'`   | `import { useOutsideClick } from '@ambiki/impulse-view-components/hooks'`      |
| `import { isLooselyFocusable } from '…/dist/helpers/focus'`      | `import { isLooselyFocusable } from '@ambiki/impulse-view-components/helpers'` |
| Any other `…/dist/helpers/*`, or `…/dist/elements/autocomplete/<module>` such as `ajax_search` | None. These modules are internal, and stay reachable only through their `dist/` paths. |

Each element path exports its class by name, such as `AwcPopoverElement`, along with the types its properties use.
`…/hooks` exports the types the hooks take and return.
