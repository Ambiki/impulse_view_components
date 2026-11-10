module Impulse
  module Popover
    class PanelComponent < ApplicationComponent
      renders_one :header, lambda { |**system_args|
        Impulse::Popover::HeaderComponent.new(**system_args, title_id: @title_id)
      }

      renders_one :body, lambda { |**system_args|
        system_args[:tag] ||= :div
        system_args[:class] = class_names(system_args[:class], "popover-body")

        Impulse::BaseRenderer.new(**system_args)
      }

      # `trigger_id_reader` returns the trigger's id. It's read when the panel renders, as the trigger may be set after
      # the panel and give its own id.
      def initialize(id:, trigger_id_reader:, **system_args)
        @trigger_id_reader = trigger_id_reader
        @title_id = "#{id}-title"
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:id] = id
        @system_args[:role] = :dialog
        @system_args[:popover] = :manual
        @system_args[:tabindex] = -1
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-popover-container",
          "bs-popover-auto"
        )
        @system_args[:data] = merge_attributes(
          system_args[:data],
          target: "awc-popover.panel"
        )
      end

      def before_render
        with_header unless header?
      end

      private

      # The id of what names the panel, which is a dialog and needs an accessible name: the header's title, or the trigger
      # when there is none. The header's title is only set once the header renders, which a slot does once.
      def label_id
        header.to_s
        header.titled? ? @title_id : @trigger_id_reader.call
      end
    end
  end
end
