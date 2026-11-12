module Impulse
  module Internal
    # The grid the calendars share, whatever their level shows: days for `DateCalendarComponent` and
    # `WeekCalendarComponent`, months for `MonthCalendarComponent`, years for `YearCalendarComponent` (ADR 0016). It is
    # internal, and not part of the public API. It renders the first page, and the element renders the pages the user
    # moves to (ADR 0014). The Rails settings a calendar uses are always rendered, so the element never falls back to the
    # browser's (ADR 0015).
    #
    # The selection is a date range: a day, a week, a month or a year. The value names it, written as the calendar writes
    # values, and so do `min` and `max`. A subclass names its element and its level, and decides what a cell selects,
    # which cells are disabled, and any hint. A calendar with a level above its own renders its heading as the button
    # that drills up to it (ADR 0017); the element alone renders the levels above.
    class CalendarGridComponent < ApplicationComponent
      ISO_DATE = /\A\d{4}-\d{2}-\d{2}\z/

      # `value`, `min` and `max` are a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, or a string. Times are read in
      # the calendar's time zone: `time_zone:`, else the zone of an `ActiveSupport::TimeWithZone` value, else `Time.zone`.
      def initialize(value: nil, min: nil, max: nil, time_zone: nil, first_day_of_week: Date.beginning_of_week, **system_args)
        @time_zone = find_time_zone(time_zone, value)
        @first_day_of_week = to_day_of_week(first_day_of_week)
        day = to_date(value)
        @selected = day && range_of(level.cell_of(day))
        @min = to_limit(min, :min)
        @max = to_limit(max, :max)
        @today = level.cell_of(@time_zone.today)
        # The value names the selection, and the calendar opens on its page, as the element's `resetView` does.
        @value_cell = @selected&.begin
        @displayed_page = level.page_of(@value_cell || @today)
        # The cell holding the grid's one tab stop.
        @active_cell = @value_cell || @today
        id = self.class.generate_id
        @heading_id = "#{id}-heading"
        @hint_id = "#{id}-hint"
        # The element names the hint the same way when it renders the heading again.
        @drill_hint_id = "#{@heading_id}-#{level_above.cell}" if level_above

        @system_args = system_args
        @system_args[:tag] = tag_name.to_sym
        @system_args[:class] = class_names(system_args[:class], tag_name)
        @system_args[:value] = (@value_cell && format_value(@value_cell)) || value.presence
        @system_args[:min] = (@min && format_value(@min)) || min.presence
        @system_args[:max] = (@max && format_value(@max)) || max.presence
        # Rails names zones its own way, such as "Eastern Time (US & Canada)". The browser needs the IANA name.
        @system_args[:"time-zone"] = @time_zone.tzinfo.identifier
        @system_args[:"first-day-of-week"] = @first_day_of_week if level.weekdays
        @system_args[:i18n] = i18n.to_json
      end

      private

      # The element's tag, which also prefixes the grid's class names and names its targets and actions.
      def tag_name
        raise NotImplementedError
      end

      # What the grid's cells are: days, months or years.
      def level
        raise NotImplementedError
      end

      # The range of dates a cell selects: a day, its week, a month or a year.
      def range_of(_cell)
        raise NotImplementedError
      end

      # A cell the user can move to but not commit.
      def disabled?(_cell)
        raise NotImplementedError
      end

      # The level the heading drills up to, or `nil` for none. By default, none.
      def level_above
        nil
      end

      # The names and patterns the element renders the pages the user moves to with: its level's, and, for a calendar
      # that drills up, the level above's too, and the page buttons' names on each, under `paging`.
      def i18n
        return level.i18n unless level_above

        levels = [level, level_above]
        levels.map(&:i18n).reduce(:deep_merge).merge(
          paging: levels.to_h { |each| [each.cell, { previous: each.previous_label, next: each.next_label }] }
        )
      end

      # Text that describes the grid to screen readers, or `nil` for none.
      def hint
        nil
      end

      # The heading's content: below the top level, a button that drills up, named by its text. The header listens
      # for its clicks, as the element replaces it on every drill.
      def heading_content
        heading = level.heading(@displayed_page)
        return heading unless level_above

        tag.button(heading, type: "button", class: "btn btn-sm btn-light #{tag_name}-heading-button", "aria-describedby": @drill_hint_id)
      end

      # The value naming the selection, or a limit, that starts with `cell`. By default, the day as `YYYY-MM-DD`.
      def format_value(cell)
        cell.iso8601
      end

      # The earliest day `min` allows, or the latest `max` does. By default, the day itself.
      def to_limit(value, _limit)
        to_date(value)
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

      def selected?(cell)
        !!@selected&.cover?(cell)
      end

      def outside?(cell)
        level.compare_pages(cell, @displayed_page) != 0
      end

      # Paging stops at the pages holding `min` and `max`, and never goes further from them than the displayed page.
      def previous_page_disabled?
        !!@min && level.compare_pages(@displayed_page, @min) <= 0
      end

      def next_page_disabled?
        !!@max && level.compare_pages(@displayed_page, @max) >= 0
      end
    end
  end
end
