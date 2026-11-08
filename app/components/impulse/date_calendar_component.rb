module Impulse
  # A static grid of a month's days for choosing one. It renders no input or popover of its own: the app shows it
  # inline or in a popover, and listens for `awc-date-calendar:commit`.
  class DateCalendarComponent < Internal::DayGridComponent
    def initialize(disabled_days_of_week: [], **)
      super(**)
      @disabled_days_of_week = disabled_days_of_week.map { |day| to_day_of_week(day) }.uniq.sort
      @system_args[:"disabled-days-of-week"] = @disabled_days_of_week.to_json if @disabled_days_of_week.any?
    end

    private

    def tag_name
      "awc-date-calendar"
    end

    # A day selects itself.
    def range_of(date)
      date..date
    end

    # A day is disabled before `min`, after `max`, or on a disabled day of the week.
    def disabled?(date)
      (@min && date < @min) || (@max && date > @max) || @disabled_days_of_week.include?(date.wday)
    end
  end
end
