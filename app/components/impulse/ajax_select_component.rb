module Impulse
  class AjaxSelectComponent < ApplicationComponent
    renders_one :blankslate
    renders_one :error

    Option = Struct.new(:value, :text)
    private_constant :Option

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
      Option.new(value: value_for_collection(element, @value_method), text: value_for_collection(element, @text_method))
    end

    def multiple?
      @system_args[:multiple]
    end
  end
end
