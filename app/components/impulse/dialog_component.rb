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

    def initialize(id: self.class.generate_id, title:, **system_args)
      @id = id
      @title = title
      @system_args = system_args
      @system_args[:tag] = :"awc-dialog"
      @system_args[:id] = @id
      @system_args[:trigger_id] = trigger_id
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
