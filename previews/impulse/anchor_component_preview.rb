module Impulse
  class AnchorComponentPreview < ViewComponent::Preview
    # Scroll the anchor towards an edge of the viewport to see flip, shift and auto size at work.
    #
    # @display floating_ui true
    # @param placement select ["top", "top-start", "top-end", "right", "right-start", "right-end", "bottom", "bottom-start", "bottom-end", "left", "left-start", "left-end"]
    # @param distance number
    # @param skidding number
    # @param flip toggle
    # @param shift toggle
    # @param auto_size select [["None", ""], "height", "width", "both"]
    # @param auto_size_padding number
    def default(placement: "bottom", distance: 8, skidding: 0, flip: true, shift: true, auto_size: "", auto_size_padding: 0)
      render_with_template(
        locals: { placement:, distance:, skidding:, flip:, shift:, auto_size: auto_size.presence, auto_size_padding: }
      )
    end
  end
end
