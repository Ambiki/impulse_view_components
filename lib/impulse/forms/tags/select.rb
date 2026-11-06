module Impulse
  module Forms
    module Tags
      class Select < Base
        def initialize(object_name, method_name, template_object, choices, options)
          @choices = choices
          super(object_name, method_name, template_object, options)
        end

        def render(&block)
          @template_object.render(
            Impulse::SelectComponent.new(@object_name, @method_name, @choices, selected: selected_value, **component_options),
            &block
          )
        end
      end
    end
  end
end
