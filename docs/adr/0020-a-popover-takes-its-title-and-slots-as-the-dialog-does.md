---
status: accepted
---

# A popover takes its title and slots as the dialog does

After #410, the dialog's header took a block, `visually_hide_title:` and `hide_close_button:`, while the popover set its title with `header.with_title`, let its trigger name a panel without one, showed its close button only beside a title, and nested its header and body in `with_panel` (#381). An app that learned one had to relearn the other (#411). We give the popover the dialog's API: a required `title:` on `Impulse::PopoverComponent`, which always names the panel, and `with_header` and `with_body` on the component itself. The header is the dialog's: the title as an `h2`, the block beside it and a close button, rendered without a `with_header` call, and hidden in part or whole with `visually_hide_title:` and `hide_close_button:`.

The title is required, as the dialog's is (ADR 0018), because the panel is a dialog and needs a name. The trigger gave one, but often a poor one, such as an icon's label or "Open", and a hidden title gives a good name to a popover that shows none. A required argument can later become optional without breaking a call; an optional one can't become required.

## Considered Options

- **Keep the title optional, the trigger naming a panel without one**, as Radix and Base UI do. Rejected: two naming rules for two dialogs, and `visually_hide_title:` would mean nothing on a popover without a title.
- **Keep `with_panel`**, which #381 added after shadcn's `PopoverContent`. Rejected: its only use is attributes on the panel, which none of Ambiki's 14 popovers sets, and the width already reaches the panel through `--awc-popover-max-width` on `<awc-popover>`. A `panel_arguments:` hash can be added later without breaking anything; flattening later would break every popover again.
- **Keep `header.with_title` beside `title:`**, for a title with markup of its own. Rejected: two ways to set the title, which ADR 0018 turned down for the dialog. Markup beside the title goes in the header's block.
- **Render the header only when `with_header` is called**, so a popover shows no title by default. Rejected: lighter for a calendar in a popover, but the same call would render a title in a dialog and none in a popover.
- **A `span` title, or a `title_tag:` argument.** Rejected: heading navigation finds an `h2`, as it does in the dialog. A popover open inside a deeper section breaks the heading order while it is open, which we accept for one rule.

## Consequences

- This is breaking. Every popover takes a `title:` and loses its `with_panel` block, and a `header.with_title` becomes the `title:`. `Impulse::Popover::PanelComponent` is removed.
- A popover that shows no title, such as a calendar in a popover, renders `with_header(visually_hide_title: true, hide_close_button: true)`. No header renders, and the hidden title still names the panel.
- The trigger no longer names the panel (ADR 0004), and a popover's title is no longer optional (ADR 0018).
- The component's block replaces the body, as the dialog's replaces its body and footer. The header stays.
- `Impulse::Popover::BodyComponent` is public, as the dialog's body is, so a response can render it without the component. It drops its `tag:` argument.
- A response loaded into a popover fills its body or its header's block, not its title. Opening the popover moves focus into it, so its name is announced before any response arrives. A title that changes later would need an `id:` argument for its id to derive from, as the dialog's does.
- The close buttons keep their names: "Close" in a popover, "Close dialog" in a dialog.
- What still differs is on purpose: the popover's trigger slot, and the dialog's `size:`, `center:`, `fullscreen:` and footer. A popover footer can be added without breaking anything.
