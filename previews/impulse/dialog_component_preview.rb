module Impulse
  class DialogComponentPreview < ViewComponent::Preview
    # @display center true
    # @param size select ["sm", "md", "lg"]
    # @param center toggle
    # @param fullscreen select ["never", "always", "sm_down", "md_down", "lg_down", "xl_down"]
    # @param open toggle
    # @param hide_on_outside_click toggle
    def default(fullscreen: "none", size: "md", center: true, open: false, hide_on_outside_click: true)
      render_with_template(locals: { fullscreen:, size:, center:, open:, hide_on_outside_click: })
    end

    # @display center true
    def with_footer
      render_with_template
    end

    # @display center true
    def long_body
      render_with_template
    end

    # @display center true
    def nested_dialog
      render_with_template
    end

    # @display center true
    def with_form
      render_with_template
    end

    def long_scrolling_content
      render_with_template
    end

    # @display center true
    def with_popover
      render_with_template
    end
  end
end
