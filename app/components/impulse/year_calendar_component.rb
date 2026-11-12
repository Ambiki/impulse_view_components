module Impulse
  # A static grid of years for choosing one, a decade at a time. It renders no input or popover of its own: the app shows
  # it inline or in a popover, and listens for `awc-year-calendar:commit`. Its value, `min` and `max` are years, `YYYY`.
  class YearCalendarComponent < Internal::CalendarGridComponent
    # A four-digit year, from 1000 to 9999.
    YEARS = 1000..9999

    # `value`, `min` and `max` are an `Integer` such as `2026`, a string such as `"2026"`, or a `Date`, a `Time` or
    # `ActiveSupport::TimeWithZone`, read as its year in the calendar's time zone. Anything else names no year. There is
    # no `first_day_of_week:`: a year calendar has no weeks.
    def initialize(value: nil, min: nil, max: nil, time_zone: nil, **system_args)
      raise ArgumentError, "unknown keyword: :first_day_of_week" if system_args.key?(:first_day_of_week)

      super
    end

    private

    def tag_name
      "awc-year-calendar"
    end

    def level
      @level ||= Internal::YearLevel.new
    end

    # A year selects its days, from January 1 to December 31.
    def range_of(cell)
      cell..Date.new(cell.year, 12, 31)
    end

    def disabled?(cell)
      (@min && cell.year < @min.year) || (@max && cell.year > @max.year)
    end

    def format_value(cell)
      cell.year.to_s
    end

    # Only a year names a year: an `Integer`, a four-digit string, or a `Date` or time, read in the time zone.
    def to_date(value)
      year =
        case value
        when Integer then value
        when /\A[1-9]\d{3}\z/ then value.to_i
        when String then nil
        else super&.year
        end
      Date.new(year, 1, 1) if YEARS.cover?(year)
    end

    # `max` allows its whole year.
    def to_limit(value, limit)
      date = to_date(value)
      date && ((limit == :max) ? Date.new(date.year, 12, 31) : Date.new(date.year, 1, 1))
    end
  end
end
