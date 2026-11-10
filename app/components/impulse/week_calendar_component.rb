module Impulse
  # A static grid of a month's days for choosing a week: committing a day commits its week. It renders no input or
  # popover of its own: the app shows it inline or in a popover, and listens for `awc-week-calendar:commit`. Its value
  # is the week's first day; any day given as the value names the week it falls in.
  class WeekCalendarComponent < Internal::CalendarGridComponent
    private

    def tag_name
      "awc-week-calendar"
    end

    def level
      @level ||= Internal::DayLevel.new(first_day_of_week: @first_day_of_week)
    end

    # Its heading drills up to months, then years (ADR 0017).
    def levels_above
      @levels_above ||= [Internal::MonthLevel.new, Internal::YearLevel.new]
    end

    # A day selects its week.
    def range_of(date)
      first = level.beginning_of_week(date)
      first..(first + 6)
    end

    def hint
      t("impulse.week_calendar.hint")
    end

    # A day is disabled when none of its week's days falls between `min` and `max`: a week can be committed when any
    # of them does.
    def disabled?(date)
      week = range_of(date)
      (@min && week.end < @min) || (@max && week.begin > @max)
    end
  end
end
