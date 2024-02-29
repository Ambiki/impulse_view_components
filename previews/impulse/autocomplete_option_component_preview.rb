module Impulse
  class AutocompleteOptionComponentPreview < ViewComponent::Preview
    # @param text text
    def default(text: "Label text")
      render(Impulse::Autocomplete::OptionComponent.new(value: "value", text:))
    end

    # @param text text
    # @param description text
    # @param disabled toggle
    def description(text: "Label text", description: "Option description", disabled: false)
      render(Impulse::Autocomplete::OptionComponent.new(value: "value", text:, description:, disabled:))
    end
  end
end
