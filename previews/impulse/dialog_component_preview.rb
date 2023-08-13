module Impulse
  class DialogComponentPreview < ViewComponent::Preview
    # @display center true
    def default
      render(Impulse::DialogComponent.new(title: "Create a new event")) do |c|
        c.with_trigger { "Open dialog" }
      end
    end
  end
end
