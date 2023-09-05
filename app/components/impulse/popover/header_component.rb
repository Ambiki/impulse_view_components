module Impulse
  module Popover
    class HeaderComponent < ApplicationComponent
      def initialize(title: nil, **system_args)
        @title = title
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "popover-header"
        )
      end
    end
  end
end
