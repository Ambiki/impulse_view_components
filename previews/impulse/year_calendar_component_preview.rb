module Impulse
  class YearCalendarComponentPreview < ViewComponent::Preview
    # @display center true
    # @param value text
    # @param min text
    # @param max text
    # @param time_zone text
    def default(value: "2026", min: nil, max: nil, time_zone: nil)
      render(Impulse::YearCalendarComponent.new(
        value: value.presence,
        min: min.presence,
        max: max.presence,
        time_zone: time_zone.presence
      ))
    end

    # @display center true
    def in_popover
      render_with_template
    end
  end
end
