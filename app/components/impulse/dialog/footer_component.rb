module Impulse
  module Dialog
    class FooterComponent < ApplicationComponent
      def initialize(**system_args)
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-dialog-footer"
        )
      end

      def call
        render(Impulse::BaseRenderer.new(**@system_args)) { content }
      end
    end
  end
end
