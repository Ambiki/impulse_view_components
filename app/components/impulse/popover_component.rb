module Impulse
  class PopoverComponent < ApplicationComponent
    renders_one :trigger, lambda { |**system_args|
      system_args[:tag] = :button
      system_args[:type] = system_args.fetch(:type, "button")
      system_args[:role] = :button
      system_args[:"aria-haspopup"] = :dialog
      system_args[:"aria-expanded"] = false
      system_args[:"aria-controls"] = @panel_id
      system_args[:popovertarget] = @panel_id
      system_args[:"aria-disabled"] = (!!system_args[:disabled]).to_s

      system_args[:data] = merge_attributes(
        system_args[:data],
        target: "awc-popover.button"
      )

      Impulse::BaseRenderer.new(**system_args)
    }

    renders_one :header, lambda { |**system_args|
      Impulse::Popover::HeaderComponent.new(title: @title, **system_args)
    }

    renders_one :body, lambda { |**system_args|
      system_args[:tag] ||= :div
      system_args[:class] = class_names(system_args[:class], "popover-body")

      Impulse::BaseRenderer.new(**system_args)
    }

    def initialize(title: nil, click_boundaries: [], **system_args)
      @title = title
      @system_args = system_args
      @system_args[:tag] = :"awc-popover"
      @system_args[:"click-boundaries"] = click_boundaries.to_json
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
      with_header unless header?
    end
  end
end
