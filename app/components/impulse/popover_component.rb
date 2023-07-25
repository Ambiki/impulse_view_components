module Impulse
  class PopoverComponent < ApplicationComponent
    renders_one :button, lambda { |**system_args|
      system_args[:tag] ||= :button
      system_args[:type] = system_args.fetch(:type, "button")
      system_args[:role] = :button
      system_args[:"aria-haspopup"] = :dialog
      system_args[:"aria-expanded"] = false
      system_args[:"aria-controls"] = @panel_id
      system_args[:"aria-disabled"] = (!!system_args[:disabled]).to_s

      system_args[:data] = merge_attributes(
        system_args[:data],
        action: "click->awc-popover#handleButtonClick",
        target: "awc-popover.button"
      )

      Impulse::BaseRenderer.new(**system_args)
    }

    renders_one :header, lambda { |**system_args|
      system_args[:tag] ||= :div
      system_args[:class] = class_names(system_args[:class], "popover-header")

      Impulse::BaseRenderer.new(**system_args)
    }

    renders_one :body, lambda { |**system_args|
      system_args[:tag] ||= :div
      system_args[:class] = class_names(system_args[:class], "popover-body")

      Impulse::BaseRenderer.new(**system_args)
    }

    def initialize(**system_args)
      @system_args = system_args
      @system_args[:tag] = :"awc-popover"
      @panel_id = self.class.generate_id

      @system_args[:data] = merge_attributes(
        system_args[:data],
        action: "keydown->awc-popover#handleKeydown"
      )
    end

    def render?
      button.present?
    end
  end
end
