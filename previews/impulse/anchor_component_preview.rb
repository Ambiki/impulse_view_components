module Impulse
  class AnchorComponentPreview < ViewComponent::Preview
    # @display center true
    # @param placement select ["top", "top-start", "top-end", "right", "right-start", "right-end", "bottom", "bottom-start", "bottom-end", "left", "left-start", "left-end"]
    # @param distance number
    # @param skidding number
    def default(placement: "bottom", distance: 8, skidding: 0)
      render_with_template(locals: { placement:, distance:, skidding: })
    end
  end
end
