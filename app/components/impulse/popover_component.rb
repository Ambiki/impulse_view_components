module Impulse
  class PopoverComponent < ApplicationComponent
    renders_one :trigger, lambda { |**system_args|
      system_args[:tag] = :button
      system_args[:type] = system_args.fetch(:type, "button")
      # Labels the panel when it has no title, so it needs an id even when the caller didn't give one.
      @trigger_id = system_args[:id] ||= "#{@panel_id}-trigger"
      system_args[:"aria-haspopup"] = :dialog
      system_args[:"aria-expanded"] = false
      system_args[:"aria-controls"] = @panel_id
      system_args[:"aria-disabled"] = (!!system_args[:disabled]).to_s

      system_args[:data] = merge_attributes(
        system_args[:data],
        target: "awc-popover.button",
        action: "click->awc-popover#toggle"
      )

      Impulse::BaseRenderer.new(**system_args)
    }

    renders_one :panel, lambda { |**system_args|
      Impulse::Popover::PanelComponent.new(**system_args, id: @panel_id, trigger_id_reader: -> { @trigger_id })
    }

    def initialize(**system_args)
      @system_args = system_args
      @system_args[:tag] = :"awc-popover"
      @panel_id = self.class.generate_id

      @system_args[:class] = class_names(
        system_args[:class],
        "awc-popover"
      )

      @system_args[:data] = merge_attributes(
        system_args[:data],
        action: "keydown->awc-popover#handleKeydown"
      )
    end

    def render?
      trigger.present?
    end

    def before_render
      with_panel unless panel?
    end
  end
end
