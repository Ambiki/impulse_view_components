# Building the form tags on Rails' own tags

Research note, 2026-11-05. Question: how can `Impulse::Forms::Tags::Select`, `AjaxSelect` and `TimeZoneSelect` let
Rails compute the field names, ids and values, so that we stop re-implementing that?

## Summary

- The component already calls Rails' `hidden_field` and `text_field`, and Rails computes the names and ids. The bugs
  happen in the hand-off. Each Rails naming option has to be passed through three hops by hand: builder, tag,
  component. #364 is the `object` that never arrives.
- Four designs were spiked against 84 cases on Rails 7.1.6, 8.0.5.1 and 8.1.4. Two match Rails' own fields
  in every case: subclassing `Tags::Base`, and passing `object:` to the component.
- Passing `object:` has a side effect. Rails then wraps the search field in `<div class="field_with_errors">` when the
  attribute has errors.
- The public `FormBuilder#field_name` and `#field_id` miss `index: nil`, the `item[]` auto-index and
  `skip_default_ids`.

**Recommendation: design 1.** Make `Impulse::Forms::Tags::Base` a subclass of `ActionView::Helpers::Tags::Base`.

- Its constructor resolves the object and the `[]` auto-index.
- One call to its private `add_default_name_and_field` (`add_default_name_and_id` before Rails 8.0.3) computes the
  hidden fields' name and the search field's id.
- The tag passes them to the component as the `name:` and `input_id:` it already accepts. The component doesn't
  change, and the markup doesn't change.
- The cost is a dependency on a `# :nodoc:` class, the same one Action Text and several well-known gems depend on.

## How it works today

1. `Impulse::Forms::Builder#select` builds `Tags::Select` with `object:` and `**objectify_options(system_args)`
   ([builder.rb:7-16](../../lib/impulse/forms/builder.rb)). `objectify_options` is private in Rails. It returns the
   builder's `index`, `namespace`, `skip_default_ids` and `allow_method_names_outside_object`, plus `object`
   ([actionview-8.1.4 form_helper.rb:1723][fb-init-814], [:2674-2679][objectify-814]).
2. Our `Tags::Base` keeps `object:` for itself and passes everything else on as `**system_args`
   ([tags/base.rb:8-14](../../lib/impulse/forms/tags/base.rb)). `Tags::Select` and `TimeZoneSelect` read the selected
   value from the object ([tags/base.rb:21-23](../../lib/impulse/forms/tags/base.rb)).
3. `AutocompleteComponent` passes its `index`, `namespace`, `skip_default_ids` and `allow_method_names_outside_object`
   keywords to Rails' `hidden_field` and `text_field`. The hidden fields get `name`, `index` and
   `allow_method_names_outside_object`. The search field gets `id`, `index`, `namespace`, `skip_default_ids` and
   `allow_method_names_outside_object`
   ([autocomplete_component.rb:90-106](../../app/components/impulse/autocomplete_component.rb)). The template calls
   `hidden_field` four times (the include_hidden field, one per selected option, one in `<template>`) and `text_field`
   once ([autocomplete_component.html.erb:4-46](../../app/components/impulse/autocomplete_component.html.erb)).
4. `AjaxSelectComponent` is not a subclass of `AutocompleteComponent`. It renders one and hands it its keywords
   ([ajax_select_component.rb:2](../../app/components/impulse/ajax_select_component.rb),
   [ajax_select_component.html.erb:1](../../app/components/impulse/ajax_select_component.html.erb)).

Rails' helpers run with the component as their template, so they look for `@item` on the component and find nothing.
For `item[]` they then raise in `retrieve_autoindex` ([actionview-8.1.4 tags/base.rb:74-81][base-814-autoindex]).
`project[item][]` raises `NameError` instead: `retrieve_autoindex` builds the instance variable name `@project[item]`
and doesn't rescue the error. `fields_for("project[item][]", item, index: nil)` raises too, because Rails looks up the
auto-index whatever `index` is ([:11-28][base-814-init]).

## What Rails does for its own fields

- `f.text_field :fruit_id` calls `@template.text_field(@object_name, method, objectify_options(options))`
  ([form_helper.rb:2024-2032][fb-codegen-814]). That builds `Tags::TextField.new(object_name, method, self, options)`
  ([:1175-1177][text-field-helper-814]).
- `Tags::Base#initialize` does four things ([tags/base.rb:11-28][base-814-init]):
  - strips a trailing `[]` from the object name;
  - takes the object from `options[:object]`, or else from an instance variable on the template;
  - reads `skip_default_ids` and `allow_method_names_outside_object` out of the options;
  - for a `[]` name, sets `@auto_index` to `object.to_param`.
- `add_default_name_and_field(options, field = "id")` computes the name and id ([:97-108][base-814-adfn]):
  - The index is the explicit `index`, `""` for `index: nil`, or else the auto-index (`name_and_id_index`,
    [:126-132][base-814-index]).
  - It keeps an explicit `name`, or else asks the public `field_name` helper, with `[]` when `multiple`
    ([:110-116][base-814-tagname], [form_tag_helper.rb:131-143][field-name-tag-814]).
  - It keeps an explicit `id`, or else asks the public `field_id` helper with the namespace
    ([form_tag_helper.rb:101-117][field-id-tag-814]). Either way, if `namespace` is still in the options, it prefixes
    the id. So an explicit id gets the namespace too.
  - With `skip_default_ids` it sets no id. It also leaves `namespace` in the options, so `text_field` renders a
    `namespace="ns"` attribute. Seen on all three versions; the component's search field has it today.
  - A hidden field with `id: nil` and a namespace gets `id="ns"`. The component avoids this by not passing `namespace`
    to its hidden fields.
- When the tag has an object, `ActiveModelInstanceTag` wraps every non-hidden tag in `field_error_proc` if
  `object.errors[method]` is present ([active_model_helper.rb:13-51][amit-814], [base.rb:162][field-error-proc-814]).
  Hidden fields are never wrapped.
- Rails' select-like tags take the selected value from `value`, not `value_before_type_cast`
  ([tags/select.rb:21][select-814], [collection_select.rb:21][csel-814], [time_zone_select.rb:19][tzs-814]). `value`
  raises `NoMethodError` when `allow_method_names_outside_object` is false and the object lacks the method
  ([tags/base.rb:36-44][base-814-value]). That's the default for `fields_for` and `form_for`
  ([form_helper.rb:1029][fields-for-defaults-814]), and `f.select :missing` raises there. Our `Tags::Base#value`
  returns `nil` instead.

## The designs

1. **Subclass `Tags::Base`.** The Impulse tags inherit from `ActionView::Helpers::Tags::Base`. The tag calls
   `add_default_name_and_field` once. It passes the resulting name and id, plus the object name with `[]` stripped, to
   the component as `name:` and `input_id:`.
2. **Pass `object:` to the component.** The component gets an `object:` keyword and forwards it to both field helpers,
   next to the four options it already forwards.
3. **Public `field_name` / `field_id`.** The builder computes `name:` and `input_id:` with `FormBuilder#field_name` and
   `#field_id` and passes them to the component.
4. **Component renders through the builder.** The builder passes itself in. The component calls
   `builder.hidden_field` and `builder.text_field`, so `objectify_options` runs on every field.

**Spike.** A throwaway test, not committed, rendered 12 form setups × 7 field calls on one builder.

- Form setups: plain model; `fields_for :items` with `index: 0` and with `index: nil`; `scope: "item[]"`;
  `fields_for("item[]", …)`; `scope: "project[item][]"`; `fields_for("project[item][]", …, index: nil)`;
  `f.fields_for("items[]", …)`; namespace; namespace with an index; `skip_default_ids`; `fields_for(:user, …)` with
  `allow_method_names_outside_object: false`.
- Field calls: `select`; `select` with `multiple`; `select` with `index: 3`, with a `name:` override and with an
  `input_id:` override; `ajax_select`; `time_zone_select`.
- Each case passes when it matches Rails' `text_field` or `hidden_field` on the same builder:
  - every hidden field's name;
  - the search field's id, which is also the `for` of `f.label`;
  - no `id` on the hidden fields;
  - no stray `index`/`namespace`/`object` attribute on `<awc-autocomplete>`.

| Rails | Today | 1. `Tags::Base` | 2. `object:` | 3. `field_name`/`field_id` | 4. builder |
| --- | --- | --- | --- | --- | --- |
| 7.1.6 | 56 pass, 28 raise | 84 pass | 84 pass | 27 pass, 29 wrong, 28 raise | 70 pass, 14 wrong |
| 8.0.5.1 | 56 pass, 28 raise | 84 pass | 84 pass | 27 pass, 29 wrong, 28 raise | 70 pass, 14 wrong |
| 8.1.4 | 56 pass, 28 raise | 84 pass | 84 pass | 27 pass, 29 wrong, 28 raise | 70 pass, 14 wrong |

- **Today:** every `[]` case raises.
- **Design 2:** with an error on the attribute, Rails wraps the search field in `<div class="field_with_errors">`.
  The wrapper becomes the flex item in `.awc-autocomplete-control`, in place of the `flex: 1 1 0%` input
  ([index.scss:6-14, 43-50](../../src/elements/autocomplete/index.scss)).
- **Design 3:** wrong for `index: nil` and `skip_default_ids`, double prefix `ns_ns_user_fruit_id`, and still raises
  for `[]`.
- **Design 4:** the 14 wrong cases are hidden fields with `id="ns"`, which passing `namespace: nil` would fix. Design 4
  wraps the search field like design 2.
- **Existing tests:** all 121 in `test/forms` and `test/components` pass with design 1 on all three versions, and with
  design 2 on 8.1.4 and 8.0.5.1.

## 1. Which Rails parent fits

| Rails parent | What it brings | Do we use it? |
| --- | --- | --- |
| `Tags::Base` ([tags/base.rb][base-814]) | Object and `[]` resolution, `add_default_name_and_field`, `value` | Yes, all of it. Same for all three tags. |
| `Tags::Select` ([select.rb:10-32][select-814-full]) | Captures a block as option HTML (`@choices = block_given? ? template_object.capture { yield … }`); `render` builds a `<select>` with `SelectRenderer` and `FormOptionsHelper` | No. Our block configures component slots. Inheriting this would mean overriding both methods. |
| `Tags::CollectionSelect` ([collection_select.rb:10-29][csel-814-full]) | `collection`, `value_method`, `text_method`; `selected` defaults to `value` | No. An ajax select has no collection. `value_method`/`text_method` apply to `selected`, and `value` would be the id, not the object. |
| `Tags::TimeZoneSelect` ([time_zone_select.rb:10-21][tzs-814-full]) | Stores `priority_zones`; `render` calls `time_zone_options_for_select` with `default` and `model` | No. The component builds its own zones from `model`. Only `@priority_zones = …` would be inherited. |
| None (design 3) | Public `FormBuilder#field_name` / `#field_id` | Not enough. See section 3. |

Only `Tags::Base` fits. The three specific parents would be refused bequests: we'd override `initialize` and `render`,
and inherit `SelectRenderer` and `FormOptionsHelper` just to ignore them.

## 2. The Rails methods each design calls

| Method | Visibility | 7.1.6 | 7.2.3.1 | 8.0.3 | 8.0.4–8.0.5.1 | 8.1.4 | main |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Tags::Base.new(object_name, method_name, template, options)` | class is `# :nodoc:` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓, internals refactored |
| `add_default_name_and_id(options)` | private | ✓ [L96][base-716-adni] | ✓ [L96][base-7231-adni] | **missing** | alias | alias [L108][base-814-adfn] | alias [L114][base-main-adfn] |
| `add_default_name_and_field(options, field = "id")` | private | – | – | ✓ [L96][base-803] | ✓ | ✓ [L97][base-814-adfn] | ✓ [L103][base-main-adfn] |
| `tag_name(multiple, index)`, `tag_id(index, namespace)` | private | ✓ [L108-114][base-716-tagname] | ✓ | ✓ | ✓ | ✓ [L110-116][base-814-tagname] | ✓ [L116-122][base-main-adfn] |
| `FormBuilder#objectify_options` | private | ✓ [L2670][objectify-716] | ✓ | ✓ | ✓ | ✓ [L2675][objectify-814] | ✓ [L3019][objectify-main] |
| `FormBuilder#field_name`, `#field_id` | public | ✓ [L1772-1796][field-id-716] | ✓ | ✓ | ✓ | ✓ [L1777-1801][field-id-814] | ✓ [L2002-2028][field-id-main] |
| `FormBuilder#hidden_field`, `#text_field` | public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `object:` option to template helpers | undocumented | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Design 1:** `Tags::Base.new`, plus `add_default_name_and_field` on Rails 8.0.3 and later, or
  `add_default_name_and_id` before 8.0.3. It reads `object` and the ivars `@object_name`, `@method_name`, `@options`,
  `@skip_default_ids` and `@template_object`.
- **Design 2:** the `object:` option. It isn't in the Rails API docs, but it's how `FormBuilder` talks to every
  template helper ([form_helper.rb:2675-2679][objectify-814]). `Tags::CollectionHelpers` passes it on too
  ([collection_helpers.rb:67][collection-object-814]).
- **Design 3:** `FormBuilder#field_name` and `#field_id`, public since Rails 7.0. See the 7.0.0 CHANGELOG for
  [`field_name`][changelog-70] and [`field_id`][changelog-70-id].
- **Design 4:** `FormBuilder#hidden_field` and `#text_field`.
- **All four:** the builder already calls private `objectify_options` today, and keeps doing so.

Local sources were checked byte for byte against the GitHub tags v7.1.6, v8.0.5.1 and v8.1.4. `tags/base.rb` is
identical in 7.1.6 and 7.2.3.1, and in 8.0.5.1 and 8.1.4.

**The rename.**

- [rails#55719][pr-55719] renamed `add_default_name_and_id` to `add_default_name_and_field` to fix the label `for` with
  a namespace (commit [cd49fa3][cd49fa3]). It was merged on 2025-09-22 and
  backported, so **v8.0.3 shipped the new name only** ([v8.0.3 tags/base.rb:83-96][base-803]).
- That broke the CKEditor and Lexxy gems ([rails#55737][issue-55737]).
- [rails#55738][pr-55738] ([da4098e][da4098e]) restored both old names as aliases: "While private, it appears to be
  used a lot by other gems". The fix shipped in v8.0.4 on 2025-10-28 ([v8.0.4 tags/base.rb:95, 108][base-804]).
- Maintainers on #55737:
  - matthewd: "While we definitely don't promise, we do generally try not to break (even) private APIs in point
    releases if it's reasonably avoidable."
  - skipkayhil: "if a method isn't documented in https://api.rubyonrails.org/ then its _internal_ and should not be
    used by libraries/applications."
- Earlier churn: a 2023 refactor of `value` ([f19f426][f19f426]). On main in October 2026, `Tags::Base#initialize`
  skips the instance-variable lookup for names with `[` ([6064d8a][6064d8a]) and only copies the object name when it
  has `[]` ([f69fd98][f69fd98]). Neither changes the constructor's signature or the naming methods.

## 3. How each design produces each output

| Output | 1. `Tags::Base` | 2. `object:` | 3. `field_name`/`field_id` | 4. builder |
| --- | --- | --- | --- | --- |
| Single hidden field name | `add_default_name_and_field` → `name:` | Rails, from the forwarded options | `field_name(method)` → `name:` | `builder.hidden_field` |
| Multiple: names with `[]` | `"multiple"` in the call adds `[]`; the same `name:` goes to the include_hidden field, the selected options and `<template>` | Rails, per field (`multiple: true`) | `field_name(method, multiple: true)` | Rails, per field |
| Search field id | the same call's `"id"` → `input_id:` | Rails | `field_id(method)` | Rails |
| … with `namespace` | prefixed once; the tag doesn't pass `namespace` on | prefixed | **prefixed twice** if the component also forwards `namespace` | prefixed; hidden fields get `id="ns"` unless `namespace: nil` |
| … with `index` / `index: nil` | ✓ / `[]` and `__` | ✓ / ✓ | ✓ / **no `[]`** | ✓ / ✓ |
| … with `item[]`, `project[item][]` | ✓, from `Tags::Base#initialize`; the component gets `item` / `project[item]` | ✓ | **raises** (`field_name` gives `item[][fruit_id]`) | ✓ |
| … with `skip_default_ids` | no `"id"` set → `input_id: nil` plus `skip_default_ids:` | ✓ (keeps the stray `namespace` attribute) | **id still rendered** | ✓ |
| Selected value | `@options.fetch(:selected) { object.public_send(method) if object.respond_to?(method) }`, as today | as today | as today | as today |
| Error wrapping | none | **search field wrapped** | none | **search field wrapped** |
| User `name:` | kept as the explicit `"name"` (Rails doesn't add `[]` to it, as today) | as today | as today | as today |
| User `input_id:` | kept as the explicit `"id"`, then namespaced (`ns_my_id`, as today) | as today | as today | as today |
| User `id:` | still the `<awc-autocomplete>`'s own id | same | same | same |

`index: nil` renders `user[items][][fruit_id]` / `user_items__fruit_id`. `field_name` and `field_id` give
`user[items][fruit_id]` / `user_items_fruit_id`. With `item[]` they give `item[][fruit_id]` / `item__fruit_id`, where
Rails' fields give `item[42][fruit_id]` / `item_42_fruit_id`. They ignore `skip_default_ids`. Checked on all three
versions.

## 4. The component's keywords, and who sees `Impulse::Forms::Tags`

- `index:`, `namespace:`, `skip_default_ids:`, `allow_method_names_outside_object:`, `name:` and `input_id:` are
  documented component keywords ([select.md:27-39](../components/select.md)). They stay, and they still work for
  `Impulse::SelectComponent.new(object_name, method_name, …)`.
- With design 1, the builder path stops sending `index`, `namespace` and `allow_method_names_outside_object`. It sends
  `name:`, `input_id:` and `skip_default_ids:` instead.
- A component rendered directly with `"item[]"` and no object still raises, as Rails' own helpers do without `@item`.
  An `object:` keyword would fix that, and it can be added later. Today `object:` lands on `<awc-autocomplete>` as an
  attribute.
- `Impulse::Forms::Tags` appears nowhere in `docs/`, `README.md` or `CHANGELOG.md`. Only `Builder` references it. The
  docs describe `impulse_form_with` and the `f.select` / `f.ajax_select` / `f.time_zone_select` arguments, which don't
  change. So changing the tags' superclass and constructors isn't a breaking change.
- `Builder#template` and `delegate :render` stay.

## 5. Precedent in other gems

Each was read at the commit linked.

- **Subclass `Tags::Base` and call `add_default_name_and_*` (design 1).**
  - Rails' own Action Text: `class Tags::ActionText < Tags::Base`, then `add_default_name_and_field(options)` and
    `error_wrapping(html_tag)` ([tag_helper.rb:51-61][actiontext]). Its builder passes `objectify_options`
    ([:98-110][actiontext-builder]).
  - thoughtbot/form_props: `class Base < ::ActionView::Helpers::Tags::Base` ([inputs/base.rb:5][form-props-base]),
    `add_default_name_and_field(@options)` ([inputs/text_field.rb:10-19][form-props-text]).
  - basecamp/lexxy: `add_default_name_and_id(options)` in a module prepended to `Tags::ActionText`
    ([action_text_tag.rb:9-16][lexxy]). Broken by 8.0.3.
  - galetahub/ckeditor: `Tags::TextArea.new(…)` then `tag.send(:add_default_name_and_id, options)`
    ([text_area.rb:23-28][ckeditor]). Broken by 8.0.3.
  - countries/country_select: `class CountrySelect < Base` renders with the nodoc `select_content_tag`
    ([country_select_helper.rb:21-34][country-select]). It works around a change in private `value`'s arity
    ([tag_helper.rb:7-22][country-select-value]).
  - carmen-rails ([form_helper.rb:200-208][carmen]) and the Foreman app ([react_input.rb:1-21][foreman]) do the same.
- **Ask Rails for attributes, hand the component strings.** Primer's form builder subclasses `Tags::TextField` and
  overrides private `tag` to return the options instead of HTML ([builder.rb:30-43][primer-attrs]). Its AutoComplete
  merges those in and passes them as `input_name:`/`input_id:` to the component
  ([auto_complete.rb:13, 40-41, 52-54][primer-ac]). This is design 1's
  shape, with a wider private surface.
- **Render through the builder (design 4).**
  - simple_form inputs call `@builder.text_field(attribute_name, …)` ([string_input.rb:13-15][sf-string]). Its boolean
    input adds a second field with `@builder.hidden_field(attribute_name, { …, id: nil })`
    ([boolean_input.rb:66-73][sf-boolean]).
  - Primer's ActionList, SelectPanel and TreeView emit
    `@form_builder.hidden_field(@input_name, multiple: …, skip_default_ids: true)` ([action_list.html.erb:3-7][primer-al]).
  - govuk-formbuilder uses `@builder.send(builder_method, …)` for single inputs ([traits/input.rb:46-48][govuk]).
- **Forward `object:` and the naming options to the template helpers (design 2).** Rails' own `FormBuilder` does it
  through `objectify_options` ([form_helper.rb:2675-2679][objectify-814]). `Tags::CollectionHelpers` does it with
  `html_options[:object] = @object` and `@input_html_options.slice(:index, :namespace)`
  ([collection_helpers.rb:22-27, 67][collection-object-814]).
- **Public `field_name` / `field_id` (design 3).** Used only for extra names and ids.
  - bootstrap_form names the hidden field of `collection_check_boxes` with `field_name(…, multiple: true)`
    ([collection_check_boxes.rb:18-20][bootstrap-form]).
  - OpenProject's autocompleter uses `builder.field_name` and `builder.field_id`, and prefixes the namespace by hand
    when an id is given ([autocompleter.rb:56-71][openproject], [rich_text_area.rb:47-52][openproject-rta]).
  - No gem we found uses them as the whole naming for an auto-indexed field.
- **Copying the algorithm.** fox_tail re-implements `name_and_id_index` and the `[]` auto-index inside a component
  ([formable.rb:107-140][fox-tail]). That's what this note is trying to avoid.
- **A public API may come.** [rails#52834][pr-52834] (open, last updated 2025-10-16) adds `attributes` to every input
  tag, "to make input options accessible without the tags". It names ViewComponent and web components as the
  motivation. If it ships, design 1 can swap its private call for `f.hidden_field(…).attributes`.

## Comparison

| | 1. Subclass `Tags::Base` | 2. Pass `object:` | 3. `field_name`/`field_id` | 4. Through the builder |
| --- | --- | --- | --- | --- |
| Fixes the #359 class | Yes on the builder path. One Rails call takes `index`, `index: nil`, the auto-index, `namespace` and `skip_default_ids`. A new Rails naming option would be one line in one place. | Only by completing the hand-off: `object` was the last option missing. A new Rails option needs threading through again. | No. Wrong for `index: nil`, the auto-index and `skip_default_ids`. | Yes. `objectify_options` runs on every field. |
| Fixes #364, incl. `project[item][]` | Yes | Yes | No, still raises | Yes |
| Markup change | None. Drops the stray `namespace` attribute under `skip_default_ids`. | Search field wrapped on errors | Wrong ids | Search field wrapped on errors, plus hidden `id="ns"` |
| Private-API exposure | Nodoc `Tags::Base`: constructor, `add_default_name_and_field`/`_id`, five ivars | Undocumented `object:` option | None | None beyond today's |
| Rails-version risk | Medium. 8.0.3 removed the old name, and needs a guard. Main is refactoring the internals. | Low | Low | Low, but an app builder that overrides `text_field` leaks into the component |
| Public API change | None | Adds `object:` keyword | None | Adds `builder:` keyword |
| Code | Tags rewritten, about the same size (108 → ~100 lines); builder same size; component unchanged | Component ~+5, tags ~+1 | Builder ~+10 | Component ~+10 |

## 6. Recommendation: design 1

Why:

- It's the only design that matches Rails in every spiked case and changes no markup.
- It needs no new public API.
- It follows Rails' own shape: a builder method builds a `Tags` object and calls `render`.
- It's what Action Text, form_props and country_select do.

`lib/impulse/forms/tags/base.rb`:

```ruby
module Impulse
  module Forms
    module Tags
      # Rails' form tags work out field names and ids. This builds on their base class, as Action Text does.
      class Base < ActionView::Helpers::Tags::Base
        private

        # The hidden fields' name and the search field's id, worked out by Rails as for any of its own fields.
        def naming_options
          field = { "multiple" => @options[:multiple], "namespace" => @options[:namespace] }
          field["name"] = @options[:name] if @options[:name]
          field["id"] = @options[:input_id] if @options[:input_id]
          field["index"] = @options[:index] if @options.key?(:index)
          add_default_name_and_field(field)
          { name: field["name"], input_id: field["id"], skip_default_ids: @skip_default_ids }
        end

        def component_options
          @options.except(:index, :namespace, :name, :input_id, :selected).merge(naming_options)
        end

        # Rails' own `value` raises when `allow_method_names_outside_object` is false and the object lacks the method.
        def selected_value
          @options.fetch(:selected) { object.public_send(@method_name) if object.respond_to?(@method_name) }
        end

        # Rails 8.0.3 has only `add_default_name_and_field`, Rails before 8.0.3 only `add_default_name_and_id`.
        # Takes Rails' `field` argument too, in case Rails calls it with one.
        def add_default_name_and_field(options, *)
          defined?(super) ? super : add_default_name_and_id(options)
        end
      end
    end
  end
end
```

`lib/impulse/forms/tags/select.rb` (`time_zone_select.rb` is the same, with `priority_zones` and
`TimeZoneSelectComponent`):

```ruby
module Impulse
  module Forms
    module Tags
      class Select < Base
        def initialize(object_name, method_name, template_object, choices, options)
          @choices = choices
          super(object_name, method_name, template_object, options)
        end

        def render(&)
          @template_object.render(
            Impulse::SelectComponent.new(@object_name, @method_name, @choices, selected: selected_value, **component_options), &
          )
        end
      end
    end
  end
end
```

`lib/impulse/forms/tags/ajax_select.rb`. It doesn't read the selection from the object, as today:

```ruby
class AjaxSelect < Base
  def initialize(object_name, method_name, template_object, value_method, text_method, options)
    @value_method, @text_method = value_method, text_method
    super(object_name, method_name, template_object, options)
  end

  def render(&)
    @template_object.render(
      Impulse::AjaxSelectComponent.new(
        @object_name, @method_name, @value_method, @text_method, selected: @options[:selected], **component_options
      ), &
    )
  end
end
```

`lib/impulse/forms/builder.rb`. Same public methods, with Rails-shaped constructors:

```ruby
def select(method_name, choices = [], **options, &)
  Tags::Select.new(object_name, method_name, template, choices, objectify_options(options)).render(&)
end

def ajax_select(method_name, value_method, text_method, **options, &)
  Tags::AjaxSelect.new(object_name, method_name, template, value_method, text_method, objectify_options(options)).render(&)
end

def time_zone_select(method_name, priority_zones = nil, **options, &)
  Tags::TimeZoneSelect.new(object_name, method_name, template, priority_zones, objectify_options(options)).render(&)
end
```

The components stay as they are.

### Risks

- **Private API.** A Rails release can rename or remove what design 1 relies on, as 8.0.3 did. The `defined?(super)`
  guard covers the known rename. It falls back on 7.1.6 and calls `super` on 8.0.5.1 and 8.1.4. The guard was not run
  on 8.0.3 itself. A Rails-main appraisal in CI would catch the next change before a release; today's appraisals are
  7.1, 8.0 and the default Gemfile (8.1) ([Appraisals](../../Appraisals)). If [rails#52834][pr-52834] ships, move to
  its public `attributes`.
- **Stripped object name.** The component receives `item`, not `item[]`. Nothing else in the components reads
  `@object_name` (checked with grep).
- **Hand-picked keys.** `naming_options` lists the keys Rails reads today ([tags/base.rb:97-107][base-814-adfn]). A new
  Rails naming option needs one line there.
- **Selected value.** `selected_value` keeps today's lenient lookup on purpose. Switching to Rails' `value` would raise
  in `fields_for` and `form_for` where it returns `nil` today. That's a breaking change and needs the maintainer's
  call.
- **Not covered here.** HTML options such as `form` and `disabled` don't reach the hidden fields today. Design 1
  doesn't change that.

### Red tests

Add to `test/forms/{select,ajax_select,time_zone_select}_test.rb`. "Red" means the test fails today.

1. `impulse_form_with(scope: "item[]", model: item)` with `item.to_param == "42"`: hidden field
   `item[42][fruit_id]`, search field `#item_42_fruit_id`, and `f.label(:fruit_id)` has `for="item_42_fruit_id"`.
   Red: `ArgumentError`.
2. `fields_for("item[]", item, builder: Impulse::Forms::Builder)`: same names. Red: `ArgumentError`.
3. `scope: "project[item][]"`: `project[item][42][fruit_id]`, `#project_item_42_fruit_id`. Red: `NameError`.
4. `fields_for("project[item][]", item, index: nil, …)`: `project[item][][fruit_id]`, `#project_item__fruit_id`.
   Red: `NameError`.
5. `multiple: true` under `item[]`: the include_hidden field, each selected option's field and the `<template>` field
   are all `item[42][fruit_ids][]`. Red.
6. `skip_default_ids: true, namespace: "ns"`: the search field has no `id` and no `namespace` attribute. Red on the
   attribute.
7. Namespace plus `fields_for :items, index: 0`: search field `#ns_user_items_0_fruit_id`, and no hidden field has an
   `id`. Green; guards against design 4's `id="ns"`.
8. `name: "custom"` under `fields_for :items, index: 0`, single and `multiple`: every hidden field is named `custom`.
   Green.
9. `input_id: "my_id"` in a namespaced form: `#ns_my_id`. Green.
10. The object has an error on the attribute: no `.field_with_errors` inside `<awc-autocomplete>`. Green; guards
    against designs 2 and 4.
11. `fields_for(:user, object_without_the_method, builder: Impulse::Forms::Builder)`: renders without
    `NoMethodError`. Green.
12. `Impulse::SelectComponent.new(:user, :fruit_id, choices, index: 3, namespace: "ns")` rendered directly: unchanged
    names and id. Green; locks the public keywords.

Tests 1–4 also cover `ajax_select` and `time_zone_select`. A table-driven test, like the spike, would cover the whole
matrix: each form setup against `f.text_field` on the same builder. A `<label for>` that points at no input fails
WCAG 2.2 SC 1.3.1 and leaves the field without an accessible name (SC 4.1.2).

## Not verified

- Rails 7.2.3.1 and main were not run. 7.2.3.1's `tags/base.rb` and `form_helper.rb` naming methods match 7.1.6. Main
  was read on GitHub at [bdb3d96][base-main].
- Rails 8.0.3 was not run. That it lacks `add_default_name_and_id` comes from the v8.0.3 source.
- Design 2 with the existing test suite was not run on 7.1.6.
- The precedent section comes from reading each gem's source at the linked commit, not from running it.

## Sources

Rails source, by version (tag commits):

- 7.1.6 (`ffcbf6f`): [tags/base.rb][base-716], [form_helper.rb][fh-716]
- 7.2.3.1 (`ba76fca`): [tags/base.rb][base-7231]
- 8.0.3 (`529f933`): [tags/base.rb][base-803]; 8.0.4 (`624fe3c`): [tags/base.rb][base-804];
  8.0.5.1 (`beef74d`): [tags/base.rb][base-8051]
- 8.1.4 (`c3466ea`): [tags/base.rb][base-814], [form_helper.rb][fh-814], [form_tag_helper.rb][field-id-tag-814],
  [form_options_helper.rb][foh-814], [tags/select.rb][select-814-full], [tags/collection_select.rb][csel-814-full],
  [tags/time_zone_select.rb][tzs-814-full], [tags/select_renderer.rb][select-renderer-814],
  [tags/collection_helpers.rb][collection-object-814], [active_model_helper.rb][amit-814], [base.rb][field-error-proc-814]
- main (`bdb3d96`): [tags/base.rb][base-main], [form_helper.rb][field-id-main]

Rails history: [rails#55719][pr-55719], [cd49fa3][cd49fa3], [rails#55737][issue-55737], [rails#55738][pr-55738],
[da4098e][da4098e], [f19f426][f19f426], [6064d8a][6064d8a], [f69fd98][f69fd98], [rails#52834][pr-52834],
[actionview 7.0 CHANGELOG][changelog-70].

Rails API docs: [FormBuilder#field_id](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-field_id),
[FormBuilder#field_name](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-field_name),
[FormHelper#fields_for](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-fields_for).

Gems: [Action Text][actiontext], [form_props][form-props-text], [lexxy][lexxy], [ckeditor][ckeditor],
[country_select][country-select], [carmen-rails][carmen], [Foreman][foreman], [Primer attributes][primer-attrs],
[Primer AutoComplete][primer-ac], [Primer ActionList][primer-al], [simple_form string][sf-string],
[simple_form boolean][sf-boolean], [govuk-formbuilder][govuk], [bootstrap_form][bootstrap-form],
[OpenProject autocompleter][openproject], [fox_tail][fox-tail].

This repo: [builder.rb](../../lib/impulse/forms/builder.rb), [tags/](../../lib/impulse/forms/tags/),
[autocomplete_component.rb](../../app/components/impulse/autocomplete_component.rb),
[autocomplete_component.html.erb](../../app/components/impulse/autocomplete_component.html.erb),
[ajax_select_component.rb](../../app/components/impulse/ajax_select_component.rb), issues
[#359](https://github.com/Ambiki/impulse_view_components/issues/359) and
[#364](https://github.com/Ambiki/impulse_view_components/issues/364), PR
[#363](https://github.com/Ambiki/impulse_view_components/pull/363).

[base-716]: https://github.com/rails/rails/blob/ffcbf6f205363f8c2fb3e9834bc86690dd59f1cb/actionview/lib/action_view/helpers/tags/base.rb
[base-716-adni]: https://github.com/rails/rails/blob/ffcbf6f205363f8c2fb3e9834bc86690dd59f1cb/actionview/lib/action_view/helpers/tags/base.rb#L96-L106
[base-716-tagname]: https://github.com/rails/rails/blob/ffcbf6f205363f8c2fb3e9834bc86690dd59f1cb/actionview/lib/action_view/helpers/tags/base.rb#L108-L114
[fh-716]: https://github.com/rails/rails/blob/ffcbf6f205363f8c2fb3e9834bc86690dd59f1cb/actionview/lib/action_view/helpers/form_helper.rb
[objectify-716]: https://github.com/rails/rails/blob/ffcbf6f205363f8c2fb3e9834bc86690dd59f1cb/actionview/lib/action_view/helpers/form_helper.rb#L2670-L2674
[field-id-716]: https://github.com/rails/rails/blob/ffcbf6f205363f8c2fb3e9834bc86690dd59f1cb/actionview/lib/action_view/helpers/form_helper.rb#L1772-L1796
[base-7231]: https://github.com/rails/rails/blob/ba76fca032a66f3716ca8a661c9ddb006acaf885/actionview/lib/action_view/helpers/tags/base.rb
[base-7231-adni]: https://github.com/rails/rails/blob/ba76fca032a66f3716ca8a661c9ddb006acaf885/actionview/lib/action_view/helpers/tags/base.rb#L96-L106
[base-803]: https://github.com/rails/rails/blob/529f933fc8b13114d308dd0752f76a9e293c8537/actionview/lib/action_view/helpers/tags/base.rb#L83-L106
[base-804]: https://github.com/rails/rails/blob/624fe3cdb9ab774ff598af29f408425178da6677/actionview/lib/action_view/helpers/tags/base.rb#L95-L108
[base-8051]: https://github.com/rails/rails/blob/beef74d4cebf42a01cd1df79e9de00df725b64fd/actionview/lib/action_view/helpers/tags/base.rb
[base-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb
[base-814-init]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb#L11-L28
[base-814-value]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb#L36-L44
[base-814-autoindex]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb#L74-L81
[base-814-adfn]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb#L97-L108
[base-814-tagname]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb#L110-L116
[base-814-index]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/base.rb#L126-L132
[fh-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb
[fb-init-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb#L1720-L1738
[field-id-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb#L1777-L1801
[fb-codegen-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb#L2024-L2032
[text-field-helper-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb#L1175-L1177
[fields-for-defaults-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb#L1029
[objectify-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_helper.rb#L2674-L2679
[field-name-tag-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_tag_helper.rb#L131-L143
[field-id-tag-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_tag_helper.rb#L101-L117
[foh-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/form_options_helper.rb#L856-L894
[select-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/select.rb#L21
[select-814-full]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/select.rb#L10-L32
[csel-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/collection_select.rb#L21
[csel-814-full]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/collection_select.rb#L10-L29
[tzs-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/time_zone_select.rb#L19
[tzs-814-full]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/time_zone_select.rb#L10-L21
[select-renderer-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/select_renderer.rb#L8-L31
[collection-object-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/tags/collection_helpers.rb#L22-L67
[amit-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/helpers/active_model_helper.rb#L13-L51
[field-error-proc-814]: https://github.com/rails/rails/blob/c3466ea00d7121798e3aa3144ffdf7174b81d8cb/actionview/lib/action_view/base.rb#L162
[base-main]: https://github.com/rails/rails/blob/bdb3d960121e7eb73a61c04099d1eef3c821e397/actionview/lib/action_view/helpers/tags/base.rb
[base-main-adfn]: https://github.com/rails/rails/blob/bdb3d960121e7eb73a61c04099d1eef3c821e397/actionview/lib/action_view/helpers/tags/base.rb#L103-L122
[objectify-main]: https://github.com/rails/rails/blob/bdb3d960121e7eb73a61c04099d1eef3c821e397/actionview/lib/action_view/helpers/form_helper.rb#L3019-L3023
[field-id-main]: https://github.com/rails/rails/blob/bdb3d960121e7eb73a61c04099d1eef3c821e397/actionview/lib/action_view/helpers/form_helper.rb#L2002-L2028
[changelog-70]: https://github.com/rails/rails/blob/984c3ef2775781d47efa9f541ce570daa2434a80/actionview/CHANGELOG.md?plain=1#L74-L84
[changelog-70-id]: https://github.com/rails/rails/blob/984c3ef2775781d47efa9f541ce570daa2434a80/actionview/CHANGELOG.md?plain=1#L302-L310
[pr-55719]: https://github.com/rails/rails/pull/55719
[cd49fa3]: https://github.com/rails/rails/commit/cd49fa3e8058d4d37112abcf5eb6d85a9bfa4137
[issue-55737]: https://github.com/rails/rails/issues/55737
[pr-55738]: https://github.com/rails/rails/pull/55738
[da4098e]: https://github.com/rails/rails/commit/da4098ea537ab3e6bfaefebfa5651dd183cb01a6
[f19f426]: https://github.com/rails/rails/commit/f19f426c6a5b69742630b6488eef043b0a1d8acc
[6064d8a]: https://github.com/rails/rails/commit/6064d8aa820b1ed68e3c27ae037605b925dfbff0
[f69fd98]: https://github.com/rails/rails/commit/f69fd981ae7f5eef247f1e872858c239a468b1aa
[pr-52834]: https://github.com/rails/rails/pull/52834
[actiontext]: https://github.com/rails/rails/blob/bdb3d960121e7eb73a61c04099d1eef3c821e397/actiontext/app/helpers/action_text/tag_helper.rb#L51-L61
[actiontext-builder]: https://github.com/rails/rails/blob/bdb3d960121e7eb73a61c04099d1eef3c821e397/actiontext/app/helpers/action_text/tag_helper.rb#L98-L110
[form-props-base]: https://github.com/thoughtbot/form_props/blob/a908d50e541357f9f20cab7c417aa19efb4c0f6d/lib/form_props/inputs/base.rb#L5
[form-props-text]: https://github.com/thoughtbot/form_props/blob/a908d50e541357f9f20cab7c417aa19efb4c0f6d/lib/form_props/inputs/text_field.rb#L10-L19
[lexxy]: https://github.com/basecamp/lexxy/blob/ebca3456217f658117beca1750a887c65e255b61/lib/lexxy/action_text_tag.rb#L9-L16
[ckeditor]: https://github.com/galetahub/ckeditor/blob/f6f8e2b2f61a8315ea0994db74d8e4a1ed6a2570/lib/ckeditor/text_area.rb#L23-L28
[country-select]: https://github.com/countries/country_select/blob/c83653ce4962a3c8160642ded1abc12576eff3bf/lib/country_select/country_select_helper.rb#L21-L34
[country-select-value]: https://github.com/countries/country_select/blob/c83653ce4962a3c8160642ded1abc12576eff3bf/lib/country_select/tag_helper.rb#L7-L22
[carmen]: https://github.com/carmen-ruby/carmen-rails/blob/50ebda9ac696306abdfc6ebd75af06cd79de2ded/lib/carmen/rails/action_view/form_helper.rb#L200-L208
[foreman]: https://github.com/theforeman/foreman/blob/536b34bd758dfd127eff6fe3a78ec6789fa647d7/app/helpers/tags/react_input.rb#L1-L21
[primer-attrs]: https://github.com/primer/view_components/blob/8b70840b436c93a335b8348d04b74acc4aa29666/app/lib/primer/forms/builder.rb#L30-L43
[primer-ac]: https://github.com/primer/view_components/blob/8b70840b436c93a335b8348d04b74acc4aa29666/app/lib/primer/forms/auto_complete.rb#L13-L54
[primer-al]: https://github.com/primer/view_components/blob/8b70840b436c93a335b8348d04b74acc4aa29666/app/components/primer/alpha/action_list.html.erb#L3-L7
[sf-string]: https://github.com/heartcombo/simple_form/blob/18f38aad0bdeca2ba1815043b94d96fdbbe6a325/lib/simple_form/inputs/string_input.rb#L13-L15
[sf-boolean]: https://github.com/heartcombo/simple_form/blob/18f38aad0bdeca2ba1815043b94d96fdbbe6a325/lib/simple_form/inputs/boolean_input.rb#L66-L73
[govuk]: https://github.com/DFE-Digital/govuk-formbuilder/blob/80261ed0e0c763cec14b908b35eb7c1d331da670/lib/govuk_design_system_formbuilder/traits/input.rb#L46-L48
[bootstrap-form]: https://github.com/bootstrap-ruby/bootstrap_form/blob/bf07f588054378805f37381a40f55faf6f181c09/lib/bootstrap_form/inputs/collection_check_boxes.rb#L18-L20
[openproject]: https://github.com/opf/openproject/blob/149bfa7b27e98d466ca224362ea571b4af020e28/lib/primer/open_project/forms/autocompleter.rb#L56-L71
[openproject-rta]: https://github.com/opf/openproject/blob/149bfa7b27e98d466ca224362ea571b4af020e28/lib/primer/open_project/forms/rich_text_area.rb#L47-L52
[fox-tail]: https://github.com/jefawks3/fox_tail/blob/0e8fab9f4788ad165e8e008942265f3604dbdd8d/app/components/fox_tail/concerns/formable.rb#L107-L140
