module Impulse
  module Popover
    class HeaderComponent < ApplicationComponent
      def initialize(title: nil, title_id: nil, **system_args)
        @title = title
        @title_id = title_id
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "popover-header"
        )
      end

      def render?
        content.present? || @title.present?
      end
    end
  end
end
