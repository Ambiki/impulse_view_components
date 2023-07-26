module Impulse
  module Forms
    class Builder < ActionView::Helpers::FormBuilder
      attr_reader :template
      delegate :render, to: :template

      def select(method_name, choices = [], **system_args, &block)
        Tags::Select.new(object:, object_name:, method_name:, template:, choices:, **system_args).render_tag(&block)
      end
    end
  end
end
