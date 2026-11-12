module Impulse
  # A static grid of a year's months for choosing one. Its heading drills up to years, to move to another year. It
  # renders no input or popover of its own: the app shows it inline or in a popover, and listens for
  # `awc-month-calendar:commit`. Its value, `min` and `max` are months, `YYYY-MM`, as native `type="month"` uses.
  class MonthCalendarComponent < Internal::CalendarGridComponent
    # A month of a four-digit year, from 1000 to 9999.
    MONTH = /\A([1-9]\d{3})-(0[1-9]|1[0-2])\z/
    YEARS = 1000..9999

    # `value`, `min` and `max` are a string such as `"2026-11"`, or a `Date`, a `Time` or `ActiveSupport::TimeWithZone`,
    # read as its month in the calendar's time zone. Anything else names no month. There is no `first_day_of_week:`: a
    # month calendar has no weeks.
    def initialize(value: nil, min: nil, max: nil, time_zone: nil, **system_args)
      raise ArgumentError, "unknown keyword: :first_day_of_week" if system_args.key?(:first_day_of_week)

      super
    end

    private

    def tag_name
      "awc-month-calendar"
    end

    def level
      @level ||= Internal::MonthLevel.new
    end

    def level_above
      @level_above ||= Internal::YearLevel.new
    end

    # A month selects its days, from its first to its last.
    def range_of(cell)
      cell..cell.end_of_month
    end

    def disabled?(cell)
      (@min && cell.end_of_month < @min) || (@max && cell > @max)
    end

    def format_value(cell)
      cell.strftime("%Y-%m")
    end

    # Only a month names a month: a `YYYY-MM` string, or a `Date` or time, read in the time zone.
    def to_date(value)
      date =
        case value
        when MONTH then Date.new(Regexp.last_match(1).to_i, Regexp.last_match(2).to_i, 1)
        when String, Integer then nil
        else super&.beginning_of_month
        end
      date if date && YEARS.cover?(date.year)
    end

    # `max` allows its whole month.
    def to_limit(value, limit)
      date = to_date(value)
      date && ((limit == :max) ? date.end_of_month : date)
    end
  end
end
