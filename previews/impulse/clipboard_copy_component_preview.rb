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

    # @display center true
    # @param feedback_duration number
    def with_feedback(feedback_duration: 2000)
      render_with_template(locals: { feedback_duration: feedback_duration })
    end
  end
end
