module Impulse
  module Forms
    module Tags
      class Select < Base
        def initialize(object:, object_name:, method_name:, template:, choices:, **system_args)
          super(object:, object_name:, method_name:, template:, **system_args)
          @choices = choices
          @value = @system_args.fetch(:selected, value)
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
          Impulse::SelectComponent.new(@object_name, @method_name, @choices, selected: @value, **@system_args)
        end
      end
    end
  end
end
