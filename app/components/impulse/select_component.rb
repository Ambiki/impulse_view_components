module Impulse
  class SelectComponent < ApplicationComponent
    renders_one :blankslate
    renders_many :options, Impulse::Autocomplete::OptionComponent

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
      return @selected.map { |value| find_option(value) } if multiple?
      find_option(@selected)
    end

    def options_from_choices
      return [] if @choices.nil?
      @choices.map do |choice|
        tuple = option_text_and_value(choice)
        OpenStruct.new(value: tuple.last, text: tuple.first)
      end
    end

    def find_option(value)
      (options.presence || options_from_choices).find { |option| option.value.to_s == value.to_s }
    end

    def multiple?
      !!@system_args[:multiple]
    end
  end
end
