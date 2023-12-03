module Impulse
  class TimeZoneSelectComponentPreview < ViewComponent::Preview
    # @display center true
    # @display max_width true
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    # @param clearable toggle
    def single_select(size: :md, placeholder: "Select a time zone", disabled: false, clearable: true)
      render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, size:, placeholder:, disabled:, clearable:))
    end

    # @display center true
    # @display max_width true
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    # @param clearable toggle
    def multiple_select(size: :md, placeholder: "Select time zones", disabled: false, clearable: true)
      render(Impulse::TimeZoneSelectComponent.new(:user, :time_zones, nil, multiple: true, size:, placeholder:, disabled:, clearable:))
    end

    # @!group Priority zones
    # @display center true
    # @display max_width true
    # @param priority_zones_title text
    def us_zones(priority_zones_title: "Priority zones")
      render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.us_zones, priority_zones_title:))
    end

    # @param priority_zones_title text
    def regex(priority_zones_title: "Priority zones")
      render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, /Australia/, priority_zones_title:))
    end

    def sorted
      render(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.all.sort))
    end

    # @!endgroup

    # @display center true
    # @display max_width true
    def form_with_single_select
      render_with_template
    end
  end
end
