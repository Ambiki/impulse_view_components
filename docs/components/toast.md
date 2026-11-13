# Toast

A short, non-modal message about something the user just did ("Copied", "Saved", "Couldn't save"), or something in
progress ("Deleting event…"). Toasts appear in the page's one toast region, go away on their own or when dismissed, and
never take focus.

## Usage

Render the region once, in the layout, near the end of `<body>`. Pass it the flash to show its messages as toasts.

```erb
<body>
  <%= yield %>

  <%= render(Impulse::ToastRegionComponent.new(flash: flash)) %>
</body>
```

Show a toast from JavaScript with `showToast`.

```js
import { showToast } from '@ambiki/impulse-view-components/toast';

showToast('Saved', { variant: 'success' });
```

## Arguments

### `Impulse::ToastRegionComponent`

| Name      | Default              | Description                                                                                                                                                      |
| ------    | -------              | -------------                                                                                                                                                    |
| flash     | `{}`                 | Renders a toast for each message under a key that names a variant, and skips the other keys. A key holding an array renders a toast for each message in it.     |
| placement | `:top_center`        | Where the toasts show: `:top_start`, `:top_center`, `:top_end`, `:bottom_start`, `:bottom_center` or `:bottom_end`. The newest toast is nearest the edge.       |
| hotkey    | `"F8"`               | The key that moves focus to the newest toast and back. `nil` turns it off.                                                                                       |
| id        | `"awc-toast-region"` | The region's `id`.                                                                                                                                               |

Any other keyword arguments are passed to the `<awc-toast-region>` element as HTML attributes.

#### Slots

| Name    | Description                                                                         |
| ------  | -------------                                                                       |
| toasts  | Toasts to show with the page, after the flash's. Takes `Impulse::ToastComponent`'s arguments. |

### `Impulse::ToastComponent`

| Name     | Default  | Description                                                                                                                                              |
| ------   | -------  | -------------                                                                                                                                            |
| variant  | `:info`  | `:info`, `:success`, `:warning` or `:danger`. The flash keys `:notice` (info), `:alert` and `:error` (danger) are taken too. Any other key raises an `ArgumentError`. |
| duration | variant's | How long, in milliseconds, the toast shows. `nil` keeps it until it is dismissed. Without one, see [Timing](#timing).                                    |

Any other keyword arguments, such as `id`, are passed to the `<awc-toast>` element as HTML attributes. Its content is the
message.

#### Slots

| Name  | Description                     |
| ------| -------------                   |
| title | A title, shown above the message. |

## Examples

### Showing a flash as a toast

`flash:` takes the flash keys Rails apps use: `notice` is info, `alert` and `error` are danger, and a variant's own name
is that variant. Keys that aren't messages are skipped. To keep some flash messages in the page instead, pass only the
others.

```erb
<%= render(Impulse::ToastRegionComponent.new(flash: flash.to_hash.slice("notice", "success"))) %>
```

### Showing a toast from the server

Append a rendered toast to the region, `#awc-toast-region`, such as from a stream response. It shows as it connects.

```erb
<%= render(Impulse::ToastComponent.new(variant: :success)) { "Goal saved." } %>
```

### A title

```erb
<%= render(Impulse::ToastComponent.new) do |toast| %>
  <% toast.with_title { "You're offline" } %>
  We kept a copy of your work in this browser.
<% end %>
```

```js
showToast('We kept a copy of your work in this browser.', { title: 'You’re offline' });
```

### A toast with rich content

Render the toast in a `<template>`, and pass the template to `showToast`. The toast is cloned each time.

```erb
<template id="clipboard-toast">
  <%= render(Impulse::ToastComponent.new(id: "clipboard-toast-message", variant: :success)) { t(".copied") } %>
</template>
```

```js
showToast(document.getElementById('clipboard-toast'));
```

### Updating a toast

Showing a toast with the `id` of one already showing updates that one in place: its message, title, variant and
duration change, its timer starts over, and it is announced again. It stays where it is among the other toasts.

```js
showToast('Deleting event…', { id: 'delete-event', duration: Infinity });
// Later
showToast('Event deleted', { id: 'delete-event', variant: 'success' });
```

A toast from a template keeps the template toast's `id`, so showing it twice updates the first instead of adding a
second.

### Timing

Info, success and warning toasts hide after 5 seconds. A danger toast, or one holding an action, such as a link or a
button other than its close button, stays until it is dismissed: an error the user can't read in time, or an action
that disappears, fails [WCAG 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html). A `duration`
always wins.

```js
showToast('Copied', { variant: 'success', duration: 2000 });
showToast('Deleting event…', { duration: Infinity });
```

Every toast's timer pauses while the pointer is over the region, while focus is in it, and while the window or the tab
is in the background. It then carries on with the time it had left.

An action in a toast must also be available elsewhere on the page: a toast is easy to miss.

### Placement

The toasts show at the top centre of the screen, 1rem from its edge. Move the region away from the edge with
`--awc-toast-region-inset`, such as to clear a fixed navbar.

```css
:root {
  --awc-toast-region-inset: 72px;
}
```

### Over a modal dialog

A modal dialog makes everything outside it inert, so the region moves into the topmost open modal dialog, and back
once it closes. Its toasts stay usable, and are announced, while a dialog is open. Don't style the region by where it
sits in the page.

## Accessibility

- The region is a landmark named "Notifications (F8)". F8 moves focus to the newest toast, and F8 again moves it back.
- Escape on a focused toast asks it to hide. Focus moves to the next toast, or back to where it was after the last.
- Screen readers announce a danger toast assertively, and the others politely.
- Each toast shows an icon for its variant, which screen readers skip. Say what happened in the message itself:
  "Couldn't save the goal", not "Error".

## Pages restored from cache

A toast goes away with its page. A page restored from cache shows none of the toasts it had: a message that has to
outlive the page is a flash, which the next page shows.

## Imports

::: code-group
```js
import { showToast } from '@ambiki/impulse-view-components/toast';
```

```scss
@import '@ambiki/impulse-view-components/toast';
```
:::

The styles need Bootstrap's Sass and the base styles loaded first. See [Import the styles](/introduction/getting-started#import-the-styles).

## JS API

[Read here](../js-api/toast.md).
