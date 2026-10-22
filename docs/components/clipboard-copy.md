# Clipboard copy

A button that copies text to the clipboard: a value rendered by the server, or the text of another element on the
page. It emits an event once the text is copied, or when it couldn't be, and shows no feedback of its own: how the
user is told, with a toast, an icon swap, or not at all, is up to your app.

## Usage

```erb
<%= render(Impulse::ClipboardCopyComponent.new(value: "https://example.com/meetings/123", class: "btn btn-primary")) do %>
  Copy link
<% end %>
```

The component renders `<awc-clipboard-copy>`, which is the button itself. It is announced as a button, takes focus,
and is pressed with a click, Enter, or Space, like a native `<button>`. Its content is what the button shows: a label,
an icon, or the value itself.

## Arguments

### Keyword arguments

| Name     | Default | Description                                                                                                       |
| ------   | ------- | -------------                                                                                                     |
| value    | N/A     | The text to copy. When given, even empty, it is copied instead of the copy source's text.                         |
| for      | N/A     | The `id` of the copy source, the element whose text is copied when there is no `value`.                           |
| disabled | `false` | Whether the button ignores presses. A disabled button takes no focus and is announced as disabled.                |

Other arguments, such as `class` or `aria`, are rendered on the element. The component adds no classes of its own.

## Examples

### Copying another element's text

Name the copy source by its `id` with `for`. A form control (`<input>`, `<textarea>` or `<select>`) gives its value;
any other element gives its text as rendered, without its hidden content and with a line break between blocks. The
text is read when the button is pressed, so changes made after rendering are copied.

```erb
<pre id="setup-command">bundle exec rails db:setup</pre>

<%= render(Impulse::ClipboardCopyComponent.new(for: "setup-command", class: "btn btn-sm btn-outline-secondary")) do %>
  Copy command
<% end %>
```

To copy something other than what the page shows, such as the text with a prefix, render it as the `value`.

### Icon-only button

A button that shows only an icon needs an accessible name, given with `aria-label`.

```erb
<%= render(Impulse::ClipboardCopyComponent.new(value: reference_number, class: "btn btn-sm", aria: { label: "Copy reference number" })) do %>
  <i class="bi bi-clipboard" aria-hidden="true"></i>
<% end %>
```

When the button has a visible label, leave out `aria-label`, or start it with the visible label, so that speech input
users can say what they see.

### Telling the user

Listen for `awc-clipboard-copy:copied` and `awc-clipboard-copy:error`, which bubble, and react as your app does
elsewhere.

```js
document.addEventListener('awc-clipboard-copy:copied', (event) => {
  showToast('Copied to clipboard');
});

document.addEventListener('awc-clipboard-copy:error', (event) => {
  showToast('Copying to the clipboard failed');
});
```

Whatever the user sees, screen reader users need to hear it too: an icon swap alone isn't announced. Put the message in
a live region, such as an element with `role="status"`, as a toast usually does.

The clipboard is only available on pages served over HTTPS or from `localhost`. Elsewhere, every press emits
`awc-clipboard-copy:error`. See the [JS API](../js-api/clipboard-copy.md) for each event's detail.

### Disabling the button

```erb
<%= render(Impulse::ClipboardCopyComponent.new(value: "Hello", disabled: true, class: "btn btn-primary")) do %>
  Copy
<% end %>
```

Like a native disabled button, it takes no focus, and no click reaches the page. Bootstrap's `.btn:disabled` styles
only match native form controls. Style a disabled button with
`awc-clipboard-copy[disabled]`, or add Bootstrap's `disabled` class.

## Imports

```js
import '@ambiki/impulse-view-components/clipboard-copy';
```

The component has no styles of its own.

## JS API

[Read here](../js-api/clipboard-copy.md).
