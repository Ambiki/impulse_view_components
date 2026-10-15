module Impulse
  class AjaxSelectComponentPreview < ViewComponent::Preview
    Option = Struct.new(:value, :text)
    Person = Struct.new(:id, :name)

    # @display center true
    # @display max_width true
    def single_select
      render(
        Impulse::AjaxSelectComponent.new(
          :user,
          :fruit_id,
          :value,
          :text,
          selected: Option.new(value: "arnold_winnie", text: "Arnold Winnie"),
          src: "/users"
        )
      )
    end

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_single_select(required: false)
      render_with_template(locals: { required: required, selected: Person.new(id: "safety_roger", name: "Safety Roger") })
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
          selected: [Option.new(value: "arnold_winnie", text: "Arnold Winnie")],
          src: "/users",
          multiple: true
        )
      )
    end

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_multiple_select(required: false)
      render_with_template(locals: { required: required, selected: [Person.new(id: "connway_hathway", name: "Connway Hathway")] })
    end
  end
end
