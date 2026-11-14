module Impulse
  # A static grid of a month's days for choosing one. It renders no input or popover of its own: the app shows it
  # inline or in a popover, and listens for `awc-date-calendar:commit`. Its heading drills up to months, then years.
  class DateCalendarComponent < Internal::CalendarGridComponent
    def initialize(disabled_days_of_week: [], **)
      @disabled_days_of_week = disabled_days_of_week.map { |day| to_day_of_week(day) }.uniq.sort
      super(**)
      @system_args[:"disabled-days-of-week"] = @disabled_days_of_week.to_json if @disabled_days_of_week.any?
    end

    private

    def tag_name
      "awc-date-calendar"
    end

    def level
      @level ||= Internal::DayLevel.new(first_day_of_week: @first_day_of_week)
    end

    # A day is also disabled on a disabled day of the week.
    def also_disabled?(date)
      @disabled_days_of_week.include?(date.wday)
    end
  end
end
