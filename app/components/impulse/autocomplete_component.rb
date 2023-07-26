module Impulse
  class AutocompleteComponent < ApplicationComponent
    renders_one :blankslate
    renders_one :error
    renders_many :options, Impulse::Autocomplete::OptionComponent

    DEFAULT_SIZE = :md
    SIZE_MAPPINGS = {
      :sm => "awc-autocomplete--sm",
      DEFAULT_SIZE => "",
      :lg => "awc-autocomplete--lg"
    }.freeze

    def initialize(object_name, method_name, selected: nil, size: DEFAULT_SIZE, name: nil, input_id: nil, placeholder: nil, include_hidden: true, disabled: false, **system_args)
      @object_name = object_name
      @method_name = method_name
      @selected = selected
      @size = size.to_s
      @name = name
      @input_id = input_id
      @placeholder = placeholder
      @include_hidden = include_hidden
      @disabled = disabled
      @system_args = system_args
      @system_args[:tag] = :"awc-autocomplete"
      @system_args[:value] = sanitized_value
      @system_args[:disabled] = disabled

      @system_args[:class] = class_names(
        system_args[:class],
        SIZE_MAPPINGS[fetch_or_fallback(SIZE_MAPPINGS.keys, size, DEFAULT_SIZE)],
        "awc-autocomplete",
        "awc-autocomplete--selected": @selected.present?
      )

      @system_args[:data] = merge_attributes(
        system_args[:data],
        action: "mousedown->awc-autocomplete#handleMousedown click->awc-autocomplete#handleClick combobox:commit->awc-autocomplete#handleCommit"
      )
    end

    private

    def sanitized_value
      return if @selected.nil?
      return @selected.map(&:value).to_s if multiple?
      @selected.value
    end

    def search_field_args
      {}.tap do |args|
        args[:id] = @input_id if @input_id
        args[:placeholder] = @placeholder
      end
    end

    def hidden_field_args
      {}.tap do |args|
        args[:name] = @name if @name
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
