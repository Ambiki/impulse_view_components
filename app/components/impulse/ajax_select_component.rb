module Impulse
  class AjaxSelectComponent < ApplicationComponent
    renders_one :blankslate
    renders_one :error

    def initialize(object_name, method_name, value_method, text_method, selected: nil, **system_args)
      @object_name = object_name
      @method_name = method_name
      @value_method = value_method
      @text_method = text_method
      @selected = selected
      @system_args = system_args

      raise ArgumentError, "`src` attribute is missing" unless @system_args[:src]
    end

    private

    def value
      return if @selected.nil?
      return @selected.map { |element| build_option(element) } if multiple?
      build_option(@selected)
    end

    def build_option(element)
      tuple = [value_for_collection(element, @text_method), value_for_collection(element, @value_method)]
      OpenStruct.new(value: tuple.last, text: tuple.first)
    end

    def multiple?
      @system_args[:multiple]
    end
  end
end
