module Impulse
  module Dialog
    class BodyComponent < ApplicationComponent
      def initialize(**system_args)
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-dialog-body"
        )

        @system_args[:data] = merge_attributes(
          system_args[:data],
          action: "scroll->awc-dialog#checkBodyScroll"
        )
      end

      def call
        render(Impulse::BaseRenderer.new(**@system_args)) { content }
      end
    end
  end
end
