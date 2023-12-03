module Impulse
  module Forms
    module Tags
      class TimeZoneSelect < Base
        def initialize(object:, object_name:, method_name:, template:, priority_zones:, **system_args)
          super(object:, object_name:, method_name:, template:, **system_args)
          @priority_zones = priority_zones
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
          Impulse::TimeZoneSelectComponent.new(@object_name, @method_name, @priority_zones, selected: @value, **@system_args)
        end
      end
    end
  end
end
