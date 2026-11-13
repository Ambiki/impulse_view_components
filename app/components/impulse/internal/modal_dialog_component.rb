module Impulse
  module Internal
    # The modal dialog `DialogComponent` and `SheetComponent` share (ADR 0019): the `<awc-dialog>` element, the title,
    # which always labels the `<dialog>` (ADR 0018), and the header, body and footer slots. It is internal, and not part
    # of the public API. A subclass lays the dialog out with the classes it adds to the element and to the `<dialog>`.
    class ModalDialogComponent < ApplicationComponent
      renders_one :header, lambda { |**system_args|
        Impulse::Dialog::HeaderComponent.new(title: @title, title_id:, **system_args)
      }

      renders_one :body, Impulse::Dialog::BodyComponent
      renders_one :footer, Impulse::Dialog::FooterComponent

      DEFAULT_FULLSCREEN = :never
      FULLSCREEN_MAPPINGS = {
        DEFAULT_FULLSCREEN => "",
        :always => "awc-dialog--fullscreen",
        :sm_down => "awc-dialog--fullscreen-sm-down",
        :md_down => "awc-dialog--fullscreen-md-down",
        :lg_down => "awc-dialog--fullscreen-lg-down",
        :xl_down => "awc-dialog--fullscreen-xl-down"
      }.freeze

      def initialize(title:, id: self.class.generate_id, fullscreen: DEFAULT_FULLSCREEN, **system_args)
        @title = title
        @id = id
        @fullscreen = fetch_or_fallback(FULLSCREEN_MAPPINGS.keys, fullscreen, DEFAULT_FULLSCREEN)
        @system_args = system_args
        @system_args[:tag] = :"awc-dialog"
        @system_args[:id] = @id
      end

      private

      # The class that lays out the element.
      def layout_class
        nil
      end

      # The class that lays out the `<dialog>`.
      def dialog_class
        nil
      end

      def title_id
        "#{@id}_title"
      end

      def before_render
        @system_args[:class] = class_names(
          @system_args[:class],
          layout_class,
          FULLSCREEN_MAPPINGS[@fullscreen],
          "awc-dialog"
        )
        with_header unless header?
      end
    end
  end
end
