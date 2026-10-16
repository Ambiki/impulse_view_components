module Impulse
  class SelectComponent < AutocompleteComponent
    # No longer used here. Kept for apps that build one to pass to `AutocompleteComponent` as `selected:`.
    OptionStruct = Struct.new(:value, :text, :html_attributes)

    def initialize(object_name, method_name, choices = [], selected: nil, **system_args)
      super(object_name, method_name, **system_args)
      @choices = choices
      @selected_value = selected
    end

    def before_render
      add_options_from_choices unless options?
      super
    end

    # The flat `options` slot this component used to declare came with `with_options`.
    def with_options(collection, &block)
      collection.map { |arguments| with_option(**arguments, &block) }
    end

    private

    # The choices the options are built from when the block adds none. Subclasses override it to supply their own.
    attr_reader :choices

    def selection
      return @selection if defined?(@selection)

      # A group runs its `with_option` block only when it renders, so the options render before the selection is looked
      # up among them. Each slot keeps what it rendered, so the template doesn't render them again.
      options.each(&:to_s)
      @selection =
        if @selected_value.blank?
          nil
        elsif multiple?
          @selected_value.map { |value| find_option(value) }.compact
        else
          find_option(@selected_value)
        end
    end

    def find_option(value)
      options
        .flat_map { |option| option.respond_to?(:options) ? option.options.to_a : [option] }
        .find { |option| option.value.to_s == value.to_s }
    end

    def add_options_from_choices
      return if choices.blank?
      return choices.each { |title, group_choices| add_group(title, group_choices) } if grouped_choices?

      option_arguments(choices).each { |arguments| with_option(**arguments) }
    end

    def add_group(title, group_choices)
      with_group(title:) do |group|
        option_arguments(group_choices).each { |arguments| group.with_option(**arguments) }
      end
    end

    def option_arguments(list)
      list.map do |choice|
        text, value = option_text_and_value(choice)
        { value:, text:, **option_html_attributes(choice) }
      end
    end

    def grouped_choices?
      choices.first.respond_to?(:last) && Array === choices.first.last
    end
  end
end
