module Impulse
  # A static grid of a year's months for choosing one. Its heading drills up to years, to move to another year. It
  # renders no input or popover of its own: the app shows it inline or in a popover, and listens for
  # `awc-month-calendar:commit`. Its value, `min` and `max` are months, `YYYY-MM`, as native `type="month"` uses, or a
  # `Date`, a `Time` or `ActiveSupport::TimeWithZone`, read as its month in the calendar's time zone. Anything else
  # names no month. There is no `first_day_of_week:`: a month calendar has no weeks.
  class MonthCalendarComponent < Internal::CalendarGridComponent
    private

    def tag_name
      "awc-month-calendar"
    end

    def level
      @level ||= Internal::MonthLevel.new
    end
  end
end
