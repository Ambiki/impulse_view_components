module Impulse
  module Forms
    module Tags
      class Base
        attr_reader :object
        delegate :render, to: :@template

        def initialize(object:, object_name:, method_name:, template:, **system_args)
          @object = object
          @object_name = object_name
          @method_name = method_name
          @template = template
          @system_args = system_args
        end

        # This is what child classes implement
        def render_tag
          raise NotImplementedError, "Subclasses must implement a render_tag method"
        end

        def value
          object.public_send(@method_name) if object&.respond_to?(@method_name)
        end
      end
    end
  end
end
