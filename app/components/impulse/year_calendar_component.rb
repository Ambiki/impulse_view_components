module Impulse
  # A static grid of years for choosing one, a decade at a time. It renders no input or popover of its own: the app shows
  # it inline or in a popover, and listens for `awc-year-calendar:commit`. Its value, `min` and `max` are years: an
  # `Integer` such as `2026`, a string such as `"2026"`, or a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, read as
  # its year in the calendar's time zone. Anything else names no year. There is no `first_day_of_week:`: a year calendar
  # has no weeks.
  class YearCalendarComponent < Internal::CalendarGridComponent
    private

    def tag_name
      "awc-year-calendar"
    end

    def level
      @level ||= Internal::YearLevel.new
    end
  end
end
