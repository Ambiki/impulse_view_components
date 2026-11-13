module Impulse
  class SheetComponentPreview < ViewComponent::Preview
    # @display center true
    # @param fullscreen select ["never", "always", "sm_down", "md_down", "lg_down", "xl_down"]
    # @param open toggle
    # @param hide_on_outside_click toggle
    def default(fullscreen: "never", open: false, hide_on_outside_click: true)
      render_with_template(locals: { fullscreen:, open:, hide_on_outside_click: })
    end

    # @display center true
    def long_body
      render_with_template
    end

    # @display center true
    def with_form
      render_with_template
    end
  end
end
