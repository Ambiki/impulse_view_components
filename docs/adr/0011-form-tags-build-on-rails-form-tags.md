---
status: accepted
---

# Form tags build on Rails' own form tags

`f.select`, `f.ajax_select` and `f.time_zone_select` render a component that calls Rails' `hidden_field` and `text_field` itself. Every Rails naming option (`index`, `namespace`, the `[]` index, `skip_default_ids`, the form's object) had to be passed by hand from the builder, through our tag, into the component, and each one we missed was a bug (#359, #364). Our tags now subclass Rails' `ActionView::Helpers::Tags::Base`, as Rails' own fields and Action Text's do. Rails resolves the object and the index and works out the hidden fields' name and the search field's id, and the tag hands them to the component as `name:` and `input_id:`. The research is in [inheriting-rails-form-tags.md](../research/inheriting-rails-form-tags.md).

## Considered Options

- **Pass `object:` on to the component.** Rejected: Rails then wraps the search field in `field_with_errors` when the attribute has errors, which breaks the control's layout, and the next Rails naming option would need passing on again.
- **Build the names with the public `FormBuilder#field_name` and `#field_id`.** Rejected: they get `index: nil`, the `[]` index and `skip_default_ids` wrong, and `item[]` still raises.
- **Render the fields through the builder.** Rejected: the hidden fields get `id="ns"` in a namespaced form, and the search field is wrapped on errors.
- **Subclass Rails' `Tags::Select`, `Tags::CollectionSelect` or `Tags::TimeZoneSelect`.** Rejected: they render a `<select>`, so we'd override all of them.

## Consequences

- We depend on a `# :nodoc:` Rails class and its private `add_default_name_and_field`. Rails 8.0.3 renamed it from `add_default_name_and_id` without an alias, so the tag calls whichever exists. A Rails release can break this again, so CI should run Rails main.
- On the builder path, Rails decides every name and id, as for its own fields. A component rendered directly still takes `index:`, `namespace:` and the other naming keywords.
- In a form without a model, the selected option comes from the view's instance variable named after the form, as Rails' own fields do.
