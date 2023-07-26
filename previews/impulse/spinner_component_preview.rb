module Impulse
  class SpinnerComponentPreview < ViewComponent::Preview
    # @param variant select ["primary", "secondary", "success", "danger", "warning", "info", "light", "dark"]
    def default(variant: :secondary)
      render(Impulse::SpinnerComponent.new(variant: variant))
    end
  end
end
