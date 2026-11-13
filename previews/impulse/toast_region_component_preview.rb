module Impulse
  class ToastRegionComponentPreview < ViewComponent::Preview
    # Toasts from the flash show as the page loads. The buttons show more, as `showToast()` does.
    #
    # @param placement select [top-start, top-center, top-end, bottom-start, bottom-center, bottom-end]
    def default(placement: "top-center")
      render_with_template(locals: { placement: placement, flash_messages: { notice: "Goal created.", alert: "Couldn't email the parents." } })
    end

    # Every variant, with and without a title, and a toast holding an action, which stays until dismissed.
    def variants
      render_with_template
    end

    # The region moves into a modal dialog while it is open, so that its toasts can still be pressed and heard.
    def over_a_dialog
      render_with_template
    end
  end
end
