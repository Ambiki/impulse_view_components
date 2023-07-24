module Impulse
  module Helpers
    module AttributesHelper
      # Merges hashes that contain keys and nested keys.
      # Eg. merge_attributes({ target: "item" }, action: "click->action")
      # => { target: "item", action: "click->action" }
      #
      # You can use this method to merge data attributes and system args.
      # Eg. @system_args[:data] = merge_attributes(system_args[:data], action: "click->action")
      def merge_attributes(*args)
        args = args.map { |el| el.presence || {} }
        args.first.deep_merge(args.second) do |_key, val, other_val|
          val + " #{other_val}"
        end
      end
    end
  end
end
