module Impulse
  class DialogComponent < ApplicationComponent
    renders_one :trigger, lambda { |**system_args|
      system_args[:tag] = :button
      system_args[:type] = :button
      system_args[:id] = trigger_id
      system_args[:"aria-haspopup"] = :dialog
      system_args[:"aria-expanded"] = "false"
      system_args[:"aria-controls"] = dialog_id

      Impulse::BaseRenderer.new(**system_args)
    }

    renders_one :header, lambda { |**system_args|
      Impulse::Dialog::HeaderComponent.new(title: @title, **system_args)
    }

    renders_one :body, lambda { |**system_args|
      system_args[:tag] = :div
      system_args[:class] = class_names(
        system_args[:class],
        "awc-dialog-body"
      )

      system_args[:data] = merge_attributes(
        system_args[:data],
        action: "scroll->awc-dialog#checkBodyScroll"
      )

      Impulse::BaseRenderer.new(**system_args)
    }

    renders_one :footer, lambda { |divider: false, **system_args|
      system_args[:tag] = :div
      system_args[:class] = class_names(
        system_args[:class],
        "awc-dialog-footer",
        "awc-dialog-footer--divider": divider
      )

      Impulse::BaseRenderer.new(**system_args)
    }

    DEFAULT_FULLSCREEN = :none
    FULLSCREEN_MAPPINGS = {
      DEFAULT_FULLSCREEN => "",
      :always => "awc-dialog--fullscreen",
      :sm_down => "awc-dialog--fullscreen-sm-down",
      :md_down => "awc-dialog--fullscreen-md-down",
      :lg_down => "awc-dialog--fullscreen-lg-down",
      :xl_down => "awc-dialog--fullscreen-xl-down"
    }

    def initialize(title:, id: self.class.generate_id, fullscreen: DEFAULT_FULLSCREEN, **system_args)
      @id = id
      @title = title
      @system_args = system_args
      @system_args[:tag] = :"awc-dialog"
      @system_args[:id] = @id
      @system_args[:trigger_id] = trigger_id
      @system_args[:class] = class_names(
        system_args[:class],
        FULLSCREEN_MAPPINGS[fetch_or_fallback(FULLSCREEN_MAPPINGS.keys, fullscreen, DEFAULT_FULLSCREEN)],
        "awc-dialog"
      )
    end

    private

    def trigger_id
      "#{@id}_trigger"
    end

    def dialog_id
      "#{@id}_dialog"
    end

    def before_render
      with_header unless header?
    end
  end
end
