module Impulse
  class ClipboardCopyComponentPreview < ViewComponent::Preview
    # @display center true
    # @param value text
    # @param disabled toggle
    def default(value: "https://example.com/meetings/123", disabled: false)
      render(Impulse::ClipboardCopyComponent.new(value: value, disabled: disabled, class: "btn btn-primary")) do
        "Copy link"
      end
    end

    # @display center true
    def with_copy_source
      render_with_template
    end
  end
end
