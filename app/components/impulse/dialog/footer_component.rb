module Impulse
  module Dialog
    class FooterComponent < ApplicationComponent
      def initialize(divider: false, **system_args)
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-dialog-footer",
          "awc-dialog-footer--divider": divider
        )
      end

      def call
        render(Impulse::BaseRenderer.new(**@system_args)) { content }
      end
    end
  end
end
