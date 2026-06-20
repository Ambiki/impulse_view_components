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
import '@ambiki/impulse-view-components/dist/elements/autocomplete';
```

```scss
@import '~@ambiki/impulse-view-components/dist/elements/autocomplete';
```

See the **Imports** section on each component's page for the exact paths.
