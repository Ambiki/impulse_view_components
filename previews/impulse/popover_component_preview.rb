module Impulse
  class PopoverComponentPreview < ViewComponent::Preview
    # @display center true
    # @param placement select ["top", "top-start", "top-end", "right", "right-start", "right-end", "bottom", "bottom-start", "bottom-end", "left", "left-start", "left-end"]
    # @param open toggle
    def default(placement: "bottom", open: false)
      render(Impulse::PopoverComponent.new(placement: placement, open: open)) do |c|
        c.with_button(class: "btn btn-primary") { "Toggle popover" }
        c.with_header { "Activity feed" }
        c.with_body { "And here's some amazing content. It's very amazing. Right?" }
      end
    end

    # @display center true
    def with_close_button
      render_with_template
    end
  end
end
