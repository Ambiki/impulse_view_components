module Impulse
  class SelectComponent < ApplicationComponent
    renders_one :blankslate
    renders_many :options, Impulse::Autocomplete::OptionComponent

    OptionStruct = Struct.new(:value, :text, :html_attributes)

    def initialize(object_name, method_name, choices = [], selected: nil, **system_args)
      @object_name = object_name
      @method_name = method_name
      @choices = choices
      @selected = selected
      @system_args = system_args
    end

    private

    def value
      return if @selected.nil?
      return @selected.map { |value| find_option(value) }.compact if multiple?
      find_option(@selected)
    end

    def options_from_choices
      return [] if @choices.nil?
      return grouped_options_for_select(@choices) if grouped_choices?
      options_for_select(@choices)
    end

    def options_for_select(choices)
      choices.map do |choice|
        html_attributes = option_html_attributes(choice)
        text, value = option_text_and_value(choice)
        OptionStruct.new(value, text, html_attributes)
      end
    end

    def grouped_options_for_select(grouped_choices)
      grouped_choices.map do |grouped_choice|
        title, container = grouped_choice
        [title, options_for_select(container)]
      end
    end

    def find_option(value)
      (options.presence || options_from_choices).flatten.find { |option| option.try(:value)&.to_s == value.to_s }
    end

    def grouped_choices?
      @choices.present? && @choices.first.respond_to?(:last) && Array === @choices.first.last
    end

    def multiple?
      !!@system_args[:multiple]
    end
  end
end
