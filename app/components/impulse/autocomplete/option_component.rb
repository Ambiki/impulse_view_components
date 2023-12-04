module Impulse
  module Autocomplete
    class OptionComponent < ApplicationComponent
      attr_reader :value, :text, :description, :system_args

      def initialize(value:, text:, description: nil, **system_args)
        @value = value
        @text = text
        @description = description
        @text_id = self.class.generate_id
        @system_args = system_args
        @system_args[:id] = system_args.fetch(:id, self.class.generate_id)
        @system_args[:tag] ||= :div
        @system_args[:role] = :option
        @system_args[:value] = value
        @system_args[:tabindex] = "-1"

        @system_args[:class] = class_names(
          system_args[:class],
          "awc-autocomplete-option dropdown-item",
          disabled: system_args[:disabled]
        )

        @system_args[:"data-text"] = text
        @system_args[:"aria-selected"] = "false"
        @system_args[:"aria-labelledby"] = @text_id
        @system_args[:"aria-disabled"] = (!!system_args[:disabled]).to_s
      end
    end
  end
end
