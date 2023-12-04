module Impulse
  class TimeZoneSelectComponent < ApplicationComponent
    renders_one :blankslate

    OptionStruct = Struct.new(:value, :text)

    def initialize(object_name, method_name, priority_zones = nil, selected: nil, default: nil, model: ::ActiveSupport::TimeZone, priority_zones_title: "Prioritized time zones", **system_args)
      @object_name = object_name
      @method_name = method_name
      @priority_zones = priority_zones
      @selected = selected
      @default = default
      @model = model
      @priority_zones_title = priority_zones_title
      @system_args = system_args
    end

    private

    def options
      priority_zones = @priority_zones

      zones = Hash.new { |h, k| h[k] = [] }.tap do |hash|
        model = @model.all

        if priority_zones
          if priority_zones.is_a?(Regexp)
            priority_zones = model.select { |z| z.match?(priority_zones) }
          end

          hash[:priority_zones] = priority_zones
          model -= priority_zones
        end

        hash[:other] = model
      end

      if zones[:other].blank?
        zones[:other] = zones[:priority_zones]
        zones[:priority_zones] = []
      end

      zones
    end

    def value
      find_option(selected) if selected.present?
    end

    def options_from_choices
      @model.all.map { |option| OptionStruct.new(option.name, option.to_s) }
    end

    def find_option(value)
      options_from_choices.find { |option| option.value == value }
    end

    def selected
      @selected || @default
    end

    def prioritized?
      options[:priority_zones].present?
    end
  end
end
