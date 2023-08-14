module Impulse
  class DialogComponentPreview < ViewComponent::Preview
    # @display center true
    # @param fullscreen select ["none", "always", "sm_down", "md_down", "lg_down", "xl_down"]
    def default(fullscreen: "none")
      render(Impulse::DialogComponent.new(title: "Edit your profile", fullscreen:)) do |c|
        c.with_trigger { "Edit profile" }
        c.with_body { "Make changes to your profile here. Click save when you're done." }
      end
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
    def custom_header
      render_with_template
    end
  end
end
