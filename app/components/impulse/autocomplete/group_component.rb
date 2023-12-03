module Impulse
  module Autocomplete
    class GroupComponent < ApplicationComponent
      renders_many :options, Impulse::Autocomplete::OptionComponent

      def initialize(title:, **system_args)
        @id = self.class.generate_id
        @title = title
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:role] = :group
        @system_args["aria-labelledby"] = @id
        @system_args[:class] = class_names(system_args[:class], "awc-autocomplete-group")

        @system_args[:data] = merge_attributes(
          system_args[:data],
          target: "awc-autocomplete.groups"
        )
      end

      def render?
        options.present?
      end
    end
  end
end
