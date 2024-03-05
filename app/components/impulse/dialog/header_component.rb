module Impulse
  module Dialog
    class HeaderComponent < ApplicationComponent
      def initialize(title:, title_id: nil, **system_args)
        @title = title
        @title_id = title_id
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-dialog-header"
        )
      end
    end
  end
end
