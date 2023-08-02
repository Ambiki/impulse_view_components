# Getting started

In your `Gemfile`, add:

```rb
gem "impulse_view_components"
```

In `config/application.rb`, add:
```rb
require "impulse/view_components/engine"
```

Most components rely on JavaScript, so you will need to install the `@ambiki/impulse-view-components` npm package and
add:
```js
import '@ambiki/impulse-view-components/dist/index';
```

You may also import only the components that you need:
```js
import '@ambiki/impulse-view-components/dist/elements/autocomplete';
```
