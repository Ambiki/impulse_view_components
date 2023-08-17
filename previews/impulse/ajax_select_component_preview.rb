module Impulse
  class AjaxSelectComponentPreview < ViewComponent::Preview
    # @display center true
    # @display max_width true
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

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_single_select(required: false)
      render_with_template(locals: {required: required})
    end

    # @display center true
    # @display max_width true
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

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_multiple_select(required: false)
      render_with_template(locals: {required: required})
    end
  end
end
