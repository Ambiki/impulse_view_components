module Impulse
  module Forms
    module Tags
      class AjaxSelect < Base
        def initialize(object_name, method_name, template_object, value_method, text_method, options)
          @value_method = value_method
          @text_method = text_method
          super(object_name, method_name, template_object, options)
        end

        def render(&block)
          @template_object.render(
            Impulse::AjaxSelectComponent.new(
              @object_name, @method_name, @value_method, @text_method, selected: @options[:selected], **component_options
            ),
            &block
          )
        end
      end
    end
  end
end
