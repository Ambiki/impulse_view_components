module Impulse
  module Popover
    # The popover's header takes the dialog's arguments (ADR 0020).
    class HeaderComponent < ApplicationComponent
      def initialize(title:, title_id:, visually_hide_title: false, hide_close_button: false, **system_args)
        @title = title
        @title_id = title_id
        @visually_hide_title = visually_hide_title
        @hide_close_button = hide_close_button
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "popover-header"
        )
      end

      private

      # Whether the header has nothing to show: no title, no block and no close button. Only the hidden title is rendered
      # then.
      def nothing_to_show?
        @visually_hide_title && @hide_close_button && content.blank?
      end

      # The title names the panel, so a hidden one is still rendered, for assistive technology only.
      def title
        tag.h2 @title, id: @title_id, class: class_names("awc-popover-title", "sr-only": @visually_hide_title)
      end
    end
  end
end
