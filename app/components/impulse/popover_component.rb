module Impulse
  # A popover takes its title and slots as the dialog does (ADR 0020).
  class PopoverComponent < ApplicationComponent
    renders_one :trigger, lambda { |**system_args|
      system_args[:tag] = :button
      system_args[:type] = system_args.fetch(:type, "button")
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

    renders_one :header, lambda { |**system_args|
      Impulse::Popover::HeaderComponent.new(**system_args, title: @title, title_id:)
    }

    renders_one :body, Impulse::Popover::BodyComponent

    def initialize(title:, **system_args)
      @title = title
      @panel_id = self.class.generate_id
      @system_args = system_args
      @system_args[:tag] = :"awc-popover"

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

    private

    def title_id
      "#{@panel_id}-title"
    end
  end
end
