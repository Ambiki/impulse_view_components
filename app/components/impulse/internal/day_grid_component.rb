module Impulse
  module Internal
    # The day grid the calendars share: `DateCalendarComponent`, `WeekCalendarComponent`, and a range calendar later.
    # It is internal, and not part of the public API. It renders the first month, and the element renders the months
    # the user moves to (ADR 0014). The time zone, the first day of the week and the translations are always rendered,
    # so the element never falls back to the browser's (ADR 0015).
    #
    # The selection is a date range: one day for a date calendar, a week for a week calendar. The value is always its
    # first day. A subclass names its element and decides what a day selects, which days are disabled, and any hint.
    class DayGridComponent < ApplicationComponent
      ISO_DATE = /\A\d{4}-\d{2}-\d{2}\z/

      # `value`, `min` and `max` are a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, or a string, either
      # `YYYY-MM-DD` or a time. Times are read in the calendar's time zone: `time_zone:`, else the zone of an
      # `ActiveSupport::TimeWithZone` value, else `Time.zone`.
      def initialize(value: nil, min: nil, max: nil, time_zone: nil, first_day_of_week: Date.beginning_of_week, **system_args)
        @time_zone = find_time_zone(time_zone, value)
        @first_day_of_week = to_day_of_week(first_day_of_week)
        day = to_date(value)
        @selected = day && range_of(day)
        @min = to_date(min)
        @max = to_date(max)
        @today = @time_zone.today
        # The value is the selection's first day, and the calendar opens on its month, as the element's `resetView` does.
        @value_day = @selected&.begin
        @displayed_month = (@value_day || @today).beginning_of_month
        # The day holding the grid's one tab stop.
        @active_day = @value_day || @today
        id = self.class.generate_id
        @heading_id = "#{id}-heading"
        @hint_id = "#{id}-hint"

        @system_args = system_args
        @system_args[:tag] = tag_name.to_sym
        @system_args[:class] = class_names(system_args[:class], tag_name)
        @system_args[:value] = @value_day&.iso8601 || value.presence
        @system_args[:min] = @min&.iso8601 || min.presence
        @system_args[:max] = @max&.iso8601 || max.presence
        # Rails names zones its own way, such as "Eastern Time (US & Canada)". The browser needs the IANA name.
        @system_args[:"time-zone"] = @time_zone.tzinfo.identifier
        @system_args[:"first-day-of-week"] = @first_day_of_week
        @system_args[:i18n] = i18n.to_json
      end

      private

      # The element's tag, which also prefixes the grid's class names and names its targets and actions.
      def tag_name
        raise NotImplementedError
      end

      # The range of dates a day selects: the day itself, or its week.
      def range_of(_date)
        raise NotImplementedError
      end

      # A day the user can move to but not commit.
      def disabled?(_date)
        raise NotImplementedError
      end

      # Text that describes the grid to screen readers, or `nil` for none.
      def hint
        nil
      end

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

      def selected?(date)
        !!@selected&.cover?(date)
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

      # The first day of the week `date` falls in.
      def beginning_of_week(date)
        date.beginning_of_week(Date::DAYS_INTO_WEEK.key(@first_day_of_week))
      end

      # The displayed month as six weeks starting on the first day of the week, filled with days of the months before
      # and after, so the grid has the same height for every month.
      def weeks
        first = beginning_of_week(@displayed_month)
        (first...(first + 42)).each_slice(7)
      end
    end
  end
end
