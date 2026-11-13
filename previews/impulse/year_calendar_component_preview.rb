module Impulse
  class YearCalendarComponentPreview < ViewComponent::Preview
    # @display center true
    # @param value text
    # @param min text
    # @param max text
    # @param time_zone text
    # @param disabled toggle
    def default(value: "2026", min: nil, max: nil, time_zone: nil, disabled: false)
      render(Impulse::YearCalendarComponent.new(
        value: value.presence,
        min: min.presence,
        max: max.presence,
        time_zone: time_zone.presence,
        disabled: disabled
      ))
    end

    # @display center true
    def in_popover
      render_with_template
    end
  end
end
