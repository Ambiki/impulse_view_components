module Impulse
  module Dialog
    class HeaderComponent < ApplicationComponent
      def initialize(title:, divider: false, **system_args)
        @title = title
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-dialog-header",
          "awc-dialog-header--divider": divider
        )
      end
    end
  end
end
