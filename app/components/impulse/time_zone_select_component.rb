module Impulse
  class TimeZoneSelectComponent < SelectComponent
    # No longer used here. Kept for apps that refer to it.
    OptionStruct = Struct.new(:value, :text)

    def initialize(object_name, method_name, priority_zones = nil, selected: nil, default: nil, model: ::ActiveSupport::TimeZone, priority_zones_title: "Prioritized time zones", **system_args)
      super(object_name, method_name, selected: selected || default, **system_args)
      @priority_zones = priority_zones
      @model = model
      @priority_zones_title = priority_zones_title
    end

    private

    def choices
      @choices_from_zones ||=
        if prioritized?
          [
            [@priority_zones_title, zone_choices(zones[:priority_zones], test_id: "priority-zones")],
            ["Other", zone_choices(zones[:other], test_id: "unprioritized-zones")]
          ]
        else
          zone_choices(zones[:other])
        end
    end

    def zone_choices(time_zones, test_id: nil)
      time_zones.map { |zone| [zone.to_s, zone.name, test_id ? { data: { test_id: } } : {}] }
    end

    def default_blankslate
      "We couldn't find that time zone!"
    end

    def zones
      @zones ||= begin
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
    end

    def prioritized?
      zones[:priority_zones].present?
    end
  end
end
