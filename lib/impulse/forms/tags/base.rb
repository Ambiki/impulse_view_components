module Impulse
  module Forms
    module Tags
      # Builds on Rails' own form tags, so that Rails works out the field names and ids as it does for its own fields.
      class Base < ActionView::Helpers::Tags::Base
        private

        # The component's options, with the hidden fields' name and the search field's id worked out by Rails.
        def component_options
          @options.except(:index, :namespace, :name, :input_id, :selected).merge(field_options)
        end

        def field_options
          field = { "multiple" => @options[:multiple], "namespace" => @options[:namespace] }
          field["name"] = @options[:name] if @options[:name]
          field["id"] = @options[:input_id] if @options[:input_id]
          field["index"] = @options[:index] if @options.key?(:index)
          add_default_name_and_field(field)
          { name: field["name"], input_id: field["id"], skip_default_ids: @skip_default_ids }
        end

        # Rails' own `value` raises when `allow_method_names_outside_object` is false and the object lacks the method.
        def selected_value
          @options.fetch(:selected) { object.public_send(@method_name) if object&.respond_to?(@method_name) }
        end

        # Rails before 8.0.3 has only `add_default_name_and_id`.
        def add_default_name_and_field(options, *)
          defined?(super) ? super : add_default_name_and_id(options)
        end
      end
    end
  end
end
