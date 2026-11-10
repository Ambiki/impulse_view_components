module Impulse
  module Popover
    class HeaderComponent < ApplicationComponent
      # Names the panel, so it always takes the id the panel is labelled by.
      renders_one :title, lambda { |**system_args|
        system_args[:tag] ||= :span
        system_args[:id] = @title_id

        Impulse::BaseRenderer.new(**system_args)
      }

      def initialize(title_id:, **system_args)
        @title_id = title_id
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "popover-header"
        )
      end

      def render?
        titled? || content.present?
      end

      # Whether the header has a title that names the panel. A blank one doesn't, so it leaves the trigger to.
      def titled?
        return false unless title?

        # The title's content is only set once it renders, which a slot does once.
        title.to_s
        title.content.present?
      end
    end
  end
end
