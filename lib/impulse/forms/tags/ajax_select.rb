module Impulse
  module Forms
    module Tags
      class AjaxSelect < Base
        def initialize(object:, object_name:, method_name:, template:, value_method:, text_method:, **system_args)
          super(object:, object_name:, method_name:, template:, **system_args)
          @value_method = value_method
          @text_method = text_method
        end

        def render_tag(&block)
          if block
            render(component) { |c| yield c }
          else
            render(component)
          end
        end

        private

        def component
          Impulse::AjaxSelectComponent.new(@object_name, @method_name, @value_method, @text_method, **@system_args)
        end
      end
    end
  end
end
