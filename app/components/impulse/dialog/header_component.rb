module Impulse
  module Dialog
    class HeaderComponent < ApplicationComponent
      def initialize(title:, title_id: nil, visually_hide_title: false, hide_close_button: false, **system_args)
        @title = title
        @title_id = title_id
        @visually_hide_title = visually_hide_title
        @hide_close_button = hide_close_button
        @system_args = system_args
        @system_args[:tag] = :div
        @system_args[:class] = class_names(
          system_args[:class],
          "awc-dialog-header"
        )
      end

      private

      # Whether the header has anything to show: its title, its block or its close button. With nothing to show, only the
      # hidden title is rendered.
      def shown?
        !@visually_hide_title || !@hide_close_button || content.present?
      end

      # The title names the dialog, so a hidden one is still rendered, for assistive technology only.
      def title
        tag.h2 @title, id: @title_id, class: class_names("awc-dialog-title", "sr-only": @visually_hide_title)
      end
    end
  end
end
