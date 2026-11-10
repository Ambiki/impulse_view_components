module Impulse
  class PopoverComponentPreview < ViewComponent::Preview
    # @display center true
    # @param title text
    # @param placement select ["top", "top-start", "top-end", "right", "right-start", "right-end", "bottom", "bottom-start", "bottom-end", "left", "left-start", "left-end"]
    def default(title: "Activity feed", placement: "bottom")
      render(Impulse::PopoverComponent.new(placement: placement)) do |c|
        c.with_trigger(class: "btn btn-primary") { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_header do |header|
            header.with_title { title }
          end
          panel.with_body { "And here's some amazing content. It's very amazing. Right?" }
        end
      end
    end

    # @display center true
    def custom_header
      render_with_template
    end

    # @display center true
    def nested
      render_with_template
    end

    # @display center true
    def with_dialog
      render_with_template
    end
  end
end
