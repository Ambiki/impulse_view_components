module Impulse
  module Forms
    class Builder < ActionView::Helpers::FormBuilder
      attr_reader :template
      delegate :render, to: :template

      def select(method_name, choices = [], **system_args, &block)
        Tags::Select.new(object_name, method_name, template, choices, objectify_options(system_args)).render(&block)
      end

      def ajax_select(method_name, value_method, text_method, **system_args, &block)
        Tags::AjaxSelect.new(
          object_name, method_name, template, value_method, text_method, objectify_options(system_args)
        ).render(&block)
      end

      def time_zone_select(method_name, priority_zones = nil, **system_args, &block)
        Tags::TimeZoneSelect.new(
          object_name, method_name, template, priority_zones, objectify_options(system_args)
        ).render(&block)
      end
    end
  end
end
