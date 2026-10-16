module Impulse
  class AutocompleteComponent < ApplicationComponent
    renders_one :blankslate
    renders_one :error
    renders_many :options, types: {
      option: { renders: Impulse::Autocomplete::OptionComponent, as: :option },
      group: { renders: Impulse::Autocomplete::GroupComponent, as: :group }
    }

    DEFAULT_SIZE = :md
    SIZE_MAPPINGS = {
      :sm => "awc-autocomplete--sm",
      DEFAULT_SIZE => "",
      :lg => "awc-autocomplete--lg"
    }.freeze

    def initialize(
      object_name,
      method_name,
      selected: nil,
      size: DEFAULT_SIZE,
      name: nil,
      input_id: nil,
      placeholder: nil,
      include_hidden: true,
      disabled: false,
      clearable: true,
      namespace: nil,
      skip_default_ids: false,
      allow_method_names_outside_object: true,
      **system_args
    )
      @object_name = object_name
      @method_name = method_name
      @selected = selected
      @size = size.to_s
      @name = name
      @input_id = input_id
      @placeholder = placeholder
      @include_hidden = include_hidden
      @disabled = disabled
      @clearable = clearable
      @namespace = namespace
      @skip_default_ids = skip_default_ids
      @allow_method_names_outside_object = allow_method_names_outside_object
      @system_args = system_args
      @system_args[:tag] = :"awc-autocomplete"
      @system_args[:disabled] = disabled
      # Holds `class` in its place among the attributes even when none is given. `root_args` fills it in when
      # rendering, once the selection is known.
      @system_args[:class] = system_args[:class]
      @system_args[:"data-loosely-focusable"] = "true"
      @system_args[:data] = merge_attributes(
        system_args[:data],
        action: "mousedown->awc-autocomplete#handleMousedown click->awc-autocomplete#handleClick combobox:commit->awc-autocomplete#handleCommit"
      )
    end

    private

    def root_args
      @system_args.merge(
        class: class_names(
          @system_args[:class],
          SIZE_MAPPINGS[fetch_or_fallback(SIZE_MAPPINGS.keys, @size, DEFAULT_SIZE)],
          "awc-autocomplete",
          "awc-autocomplete--selected": selection.present?,
          "awc-autocomplete--clearable": @clearable
        )
      )
    end

    # The selected option, or options when `multiple`, each responding to `value` and `text`. Subclasses that hold
    # their own options look the selection up among them instead.
    def selection
      @selected
    end

    # Shown when no option matches and no `blankslate` is given.
    def default_blankslate
      "We couldn't find that!"
    end

    def search_field_args
      {}.tap do |args|
        args[:id] = @input_id if @input_id
        args[:placeholder] = @placeholder
        args[:namespace] = @namespace
        args[:skip_default_ids] = @skip_default_ids
        args[:allow_method_names_outside_object] = @allow_method_names_outside_object
      end
    end

    def hidden_field_args
      {}.tap do |args|
        args[:name] = @name if @name
        args[:allow_method_names_outside_object] = @allow_method_names_outside_object
      end
    end

    def multiple?
      !!@system_args[:multiple]
    end

    def ajax?
      !!@system_args[:src]
    end
  end
end
