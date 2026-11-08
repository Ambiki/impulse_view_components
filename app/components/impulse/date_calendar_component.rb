module Impulse
  # A static grid of a month's days for choosing one. It renders no input or popover of its own: the app shows it
  # inline or in a popover, and listens for `awc-date-calendar:commit`. It renders the first month, and the element
  # renders the months the user turns to (ADR 0013).
  class DateCalendarComponent < ApplicationComponent
    ISO_DATE = /\A\d{4}-\d{2}-\d{2}\z/

    # `value` is a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, or a string, either `YYYY-MM-DD` or a time. Times
    # are read in the calendar's time zone: `time_zone:`, else the zone of an `ActiveSupport::TimeWithZone` value, else
    # `Time.zone`. The time zone, the first day of the week and the translations are always rendered, so the element
    # never falls back to the browser's (ADR 0014).
    def initialize(
      value: nil,
      min: nil,
      max: nil,
      disabled_days_of_week: [],
      time_zone: nil,
      first_day_of_week: Date.beginning_of_week,
      **system_args
    )
      @time_zone = find_time_zone(time_zone, value)
      @selected = to_date(value)
      @min = to_date(min)
      @max = to_date(max)
      @disabled_days_of_week = disabled_days_of_week.map { |day| to_day_of_week(day) }.uniq.sort
      @first_day_of_week = to_day_of_week(first_day_of_week)
      @today = @time_zone.today
      @displayed_month = (@selected || @today).beginning_of_month
      # The day holding the grid's one tab stop. The displayed month is the selected day's, or today's.
      @active_day = @selected || @today
      @heading_id = "#{self.class.generate_id}-heading"

      @system_args = system_args
      @system_args[:tag] = :"awc-date-calendar"
      @system_args[:class] = class_names(system_args[:class], "awc-date-calendar")
      @system_args[:value] = @selected&.iso8601 || value.presence
      @system_args[:min] = @min&.iso8601 || min.presence
      @system_args[:max] = @max&.iso8601 || max.presence
      @system_args[:"disabled-days-of-week"] = @disabled_days_of_week.to_json if @disabled_days_of_week.any?
      # Rails names zones its own way, such as "Eastern Time (US & Canada)". The browser needs the IANA name.
      @system_args[:"time-zone"] = @time_zone.tzinfo.identifier
      @system_args[:"first-day-of-week"] = @first_day_of_week
      @system_args[:i18n] = i18n.to_json
    end

    private

    def find_time_zone(time_zone, value)
      return Time.find_zone!(time_zone) if time_zone.present?
      return value.time_zone if value.is_a?(ActiveSupport::TimeWithZone)

      Time.zone || Time.find_zone!("UTC")
    end

    # The calendar date `value` names in the calendar's time zone, or `nil` when it names none.
    def to_date(value)
      case value
      when ActiveSupport::TimeWithZone, Time, DateTime
        value.in_time_zone(@time_zone).to_date
      when Date
        value
      when ISO_DATE
        Date.iso8601(value)
      when String
        @time_zone.parse(value)&.to_date
      end
    rescue ArgumentError
      nil
    end

    # A day of the week as `Date#wday` counts it, `0` being Sunday, from a number or a name such as `:sunday`.
    def to_day_of_week(day)
      return day if day.is_a?(Integer) && day.between?(0, 6)

      Date::DAYS_INTO_WEEK.fetch(day.respond_to?(:to_sym) ? day.to_sym : day) do
        raise ArgumentError, "#{day.inspect} isn't a day of the week"
      end
    end

    # The names and patterns the element formats the months it renders with, so they read exactly like this one.
    def i18n
      {
        monthNames: I18n.t("date.month_names").compact,
        abbrMonthNames: I18n.t("date.abbr_month_names").compact,
        dayNames: I18n.t("date.day_names"),
        abbrDayNames: I18n.t("date.abbr_day_names"),
        formats: { heading: heading_format, day: day_format }
      }
    end

    def heading_format
      I18n.t("impulse.calendar.formats.heading")
    end

    def day_format
      I18n.t("impulse.calendar.formats.day")
    end

    # A day the user can move to but not commit.
    def disabled?(date)
      (@min && date < @min) || (@max && date > @max) || @disabled_days_of_week.include?(date.wday)
    end

    # Paging stops at the months holding `min` and `max`, and never goes further from them than the displayed month.
    def previous_month_disabled?
      !!@min && @displayed_month <= @min.beginning_of_month
    end

    def next_month_disabled?
      !!@max && @displayed_month >= @max.beginning_of_month
    end

    def heading
      I18n.l(@displayed_month, format: heading_format)
    end

    # The days of the week in the grid's order, as `Date#wday` counts them.
    def days_of_week
      (0..6).map { |offset| (@first_day_of_week + offset) % 7 }
    end

    # The displayed month as six weeks starting on the first day of the week, filled with days of the months before and
    # after, so the grid has the same height for every month.
    def weeks
      first = @displayed_month.beginning_of_week(Date::DAYS_INTO_WEEK.key(@first_day_of_week))
      (first...(first + 42)).each_slice(7)
    end
  end
end
