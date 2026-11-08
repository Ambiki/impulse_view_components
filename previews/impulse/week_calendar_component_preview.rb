module Impulse
  class WeekCalendarComponentPreview < ViewComponent::Preview
    # @display center true
    # @param value text
    # @param min text
    # @param max text
    # @param first_day_of_week select [sunday, monday, saturday]
    # @param time_zone text
    def default(value: "2026-11-18", min: nil, max: nil, first_day_of_week: :sunday, time_zone: nil)
      render(Impulse::WeekCalendarComponent.new(
        value: value.presence,
        min: min.presence,
        max: max.presence,
        first_day_of_week: first_day_of_week.to_sym,
        time_zone: time_zone.presence
      ))
    end

    # @display center true
    def in_popover
      render_with_template
    end
  end
end
