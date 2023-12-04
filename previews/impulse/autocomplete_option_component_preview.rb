module Impulse
  class AutocompleteOptionComponentPreview < ViewComponent::Preview
    # @param text text
    def default(text: "Label text")
      render(Impulse::Autocomplete::OptionComponent.new(value: "value", text:))
    end

    # @param text text
    # @param description text
    def description(text: "Label text", description: "Option description")
      render(Impulse::Autocomplete::OptionComponent.new(value: "value", text:, description:))
    end
  end
end
