module Impulse
  class AjaxSelectComponentPreview < ViewComponent::Preview
    def single_select
      render(
        Impulse::AjaxSelectComponent.new(
          :user,
          :fruit_id,
          :value,
          :text,
          selected: OpenStruct.new(value: "arnold_winnie", text: "Arnold Winnie"),
          src: "/users"
        )
      )
    end

    # @param required toggle
    def form_with_single_select(required: false)
      render_with_template(locals: {required: required})
    end

    def multiple_select
      render(
        Impulse::AjaxSelectComponent.new(
          :user,
          :fruit_id,
          :value,
          :text,
          selected: [OpenStruct.new(value: "arnold_winnie", text: "Arnold Winnie")],
          src: "/users",
          multiple: true
        )
      )
    end

    # @param required toggle
    def form_with_multiple_select(required: false)
      render_with_template(locals: {required: required})
    end
  end
end
