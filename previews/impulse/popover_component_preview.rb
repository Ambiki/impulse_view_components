module Impulse
  class PopoverComponentPreview < ViewComponent::Preview
    # @display center true
    # @param title text
    # @param placement select ["top", "top-start", "top-end", "right", "right-start", "right-end", "bottom", "bottom-start", "bottom-end", "left", "left-start", "left-end"]
    # @param open toggle
    # @param dismissible toggle
    def default(title: "Activity feed", placement: "bottom", open: false, dismissible: true)
      render(Impulse::PopoverComponent.new(title: title, placement: placement, open: open, dismissible: dismissible)) do |c|
        c.with_trigger(class: "btn btn-primary") { "Toggle popover" }
        c.with_body { "And here's some amazing content. It's very amazing. Right?" }
      end
    end

    # @display center true
    def custom_header
      render_with_template
    end
  end
end
