module Impulse
  module Forms
    module Tags
      class TimeZoneSelect < Base
        def initialize(object_name, method_name, template_object, priority_zones, options)
          @priority_zones = priority_zones
          super(object_name, method_name, template_object, options)
        end

        def render(&block)
          @template_object.render(
            Impulse::TimeZoneSelectComponent.new(
              @object_name, @method_name, @priority_zones, selected: selected_value, **component_options
            ),
            &block
          )
        end
      end
    end
  end
end
