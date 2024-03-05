module Impulse
  class DialogComponent < ApplicationComponent
    renders_one :header, lambda { |**system_args|
      Impulse::Dialog::HeaderComponent.new(title: @title, title_id:, **system_args)
    }

    renders_one :body, Impulse::Dialog::BodyComponent
    renders_one :footer, Impulse::Dialog::FooterComponent

    DEFAULT_SIZE = :md
    SIZE_MAPPINGS = {
      :sm => "awc-dialog--sm",
      DEFAULT_SIZE => "",
      :lg => "awc-dialog--lg"
    }.freeze

    DEFAULT_FULLSCREEN = :never
    FULLSCREEN_MAPPINGS = {
      DEFAULT_FULLSCREEN => "",
      :always => "awc-dialog--fullscreen",
      :sm_down => "awc-dialog--fullscreen-sm-down",
      :md_down => "awc-dialog--fullscreen-md-down",
      :lg_down => "awc-dialog--fullscreen-lg-down",
      :xl_down => "awc-dialog--fullscreen-xl-down"
    }.freeze

    def initialize(title:, id: self.class.generate_id, size: DEFAULT_SIZE, center: true, fullscreen: DEFAULT_FULLSCREEN, **system_args)
      @title = title
      @id = id
      @center = center
      @system_args = system_args
      @system_args[:tag] = :"awc-dialog"
      @system_args[:id] = @id
      @system_args[:class] = class_names(
        system_args[:class],
        SIZE_MAPPINGS[fetch_or_fallback(SIZE_MAPPINGS.keys, size, DEFAULT_SIZE)],
        FULLSCREEN_MAPPINGS[fetch_or_fallback(FULLSCREEN_MAPPINGS.keys, fullscreen, DEFAULT_FULLSCREEN)],
        "awc-dialog"
      )
    end

    private

    def title_id
      "#{@id}_title"
    end

    def before_render
      with_header unless header?
    end
  end
end
