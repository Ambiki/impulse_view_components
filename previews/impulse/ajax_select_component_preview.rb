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

    def form_with_single_select
      render_with_template
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

    def form_with_multiple_select
      render_with_template
    end
  end
end
