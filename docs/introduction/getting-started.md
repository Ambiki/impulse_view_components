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

See the **Imports** section on each component's page for the exact paths.

## Import the styles

The styles are written in Sass on top of [Bootstrap 4](https://getbootstrap.com/docs/4.6/). Load Bootstrap's Sass
functions, variables and mixins first (importing all of `bootstrap` does that), then the base styles once, then each
component's styles:

```scss
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/mixins';

@import '@ambiki/impulse-view-components/base';
@import '@ambiki/impulse-view-components/autocomplete';
```

To include every component's styles, import the package itself instead of `base` and each component:

```scss
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/mixins';

@import '@ambiki/impulse-view-components';
```

These paths work through webpack's `sass-loader` and Vite. When you run the `sass` command line directly, as
`cssbundling-rails` does, prefix each path with `pkg:` and pass `--pkg-importer=node`, which needs Dart Sass 1.71 or
later:

```scss
@import 'pkg:@ambiki/impulse-view-components/base';
@import 'pkg:@ambiki/impulse-view-components/autocomplete';
```

A setup that only passes `--load-path=node_modules` can't read these paths, because it looks for files rather than
reading the package's `exports`. It can keep importing the files directly:

```scss
@import '@ambiki/impulse-view-components/dist/styles/variables';
@import '@ambiki/impulse-view-components/dist/styles/base';
@import '@ambiki/impulse-view-components/dist/elements/autocomplete';
```

### Without Sass

If your app doesn't use Sass or Bootstrap, import the precompiled CSS, which holds every component's styles:

```js
import '@ambiki/impulse-view-components/styles.css';
```

It's built with Bootstrap's default variables. Change colors and sizes through the CSS custom properties it defines
on `:root`, such as `--awc-autocomplete-control-min-height`.

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
| `@import '~…/dist/elements/<name>'`                              | `@import '@ambiki/impulse-view-components/<name>'`                             |
| `@import '~…/dist/styles/variables'` and `'~…/dist/styles/base'` | `@import '@ambiki/impulse-view-components/base'`                               |
| Any other `…/dist/helpers/*`, or `…/dist/elements/autocomplete/<module>` such as `ajax_search` | None. These modules are internal, and stay reachable only through their `dist/` paths. |

The Sass rows need a setup that reads the package's `exports`. See [Import the styles](#import-the-styles).

Each element path exports its class by name, such as `AwcPopoverElement`, along with the types its properties use.
`…/hooks` exports the types the hooks take and return.
