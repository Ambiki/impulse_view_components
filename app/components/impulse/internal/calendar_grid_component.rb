module Impulse
  module Internal
    # The grid the calendars share, whatever their level shows: days for `DateCalendarComponent` and
    # `WeekCalendarComponent`, months for `MonthCalendarComponent`, years for `YearCalendarComponent` (ADR 0016). It is
    # internal, and not part of the public API. It renders the first view, and the element renders the views the user
    # moves to (ADR 0014). The Rails settings a calendar uses are always rendered, so the element never falls back to the
    # browser's (ADR 0015).
    #
    # The selection is a date range: a day, a week, a month or a year. The value names it, written as the calendar writes
    # values, and so do `min` and `max`. A subclass names its element and its level, and may change what a cell selects,
    # disable cells of its own, and add a hint. A calendar renders its heading as the button that drills up to its
    # level's levels above (ADR 0017); the element alone renders the levels above.
    class CalendarGridComponent < ApplicationComponent
      # The years a calendar names, those with four digits, as `YYYY-MM-DD` and the element's values write them.
      YEARS = 1000..9999
      FIRST_DAY = Date.new(YEARS.begin, 1, 1)
      LAST_DAY = Date.new(YEARS.end, 12, 31)

      # `value`, `min` and `max` are a `Date`, a `Time` or `ActiveSupport::TimeWithZone`, or a string, as the level
      # writes its cells. Times are read in the calendar's time zone: `time_zone:`, else the zone of an
      # `ActiveSupport::TimeWithZone` value, else `Time.zone`. Only a calendar of days takes `first_day_of_week:`. A
      # disabled calendar can't be focused or used, as a native disabled control (ADR 0021).
      def initialize(value: nil, min: nil, max: nil, time_zone: nil, first_day_of_week: nil, disabled: false, **system_args)
        @time_zone = find_time_zone(time_zone, value)
        @first_day_of_week = to_day_of_week(first_day_of_week || Date.beginning_of_week)
        @disabled = disabled
        raise ArgumentError, "unknown keyword: :first_day_of_week" if first_day_of_week && !level.weekdays

        day = to_date(value)
        @selected = day && range_of(level.cell_of(day))
        # A selection no value can name, such as the week of December 31, 9999, is none.
        @selected = nil if @selected && past_four_digit_years?(@selected)
        @min = to_limit(min, :min)
        @max = to_limit(max, :max)
        @today = level.cell_of(@time_zone.today)
        # The value names the selection, and the calendar opens on its view, as the element's `resetView` does.
        @value_cell = @selected&.begin
        @displayed_view = level.view_of(@value_cell || @today)
        # The cell holding the grid's one tab stop.
        @active_cell = @value_cell || @today
        id = self.class.generate_id
        @heading_id = "#{id}-heading"
        @hint_id = "#{id}-hint"

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
        @system_args[:disabled] = disabled
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

      # The range of dates a cell selects: a day, its week, a month or a year. By default, the days the cell covers.
      def range_of(cell)
        level.range(cell)
      end

      # A cell the user can move to but not commit: one with none of the days it selects between `min` and `max`, or
      # within the four-digit years, or one the calendar disables for a reason of its own.
      def disabled?(cell)
        range = range_of(cell)
        past_four_digit_years?(range) || range.end < earliest || range.begin > latest || also_disabled?(cell)
      end

      # Whether the calendar disables `cell` for a reason of its own, whatever its limits allow. By default, it doesn't.
      def also_disabled?(_cell)
        false
      end

      # Whether any of `range`'s days falls outside the four-digit years, which are all a value names.
      def past_four_digit_years?(range)
        range.begin < FIRST_DAY || range.end > LAST_DAY
      end

      # The earliest day the user can commit: `min`'s, and never before the four-digit years, which are all a value
      # names.
      def earliest
        [@min, FIRST_DAY].compact.max
      end

      # The latest day the user can commit: `max`'s, and never after the four-digit years.
      def latest
        [@max, LAST_DAY].compact.min
      end

      # The levels the heading drills up to, nearest first.
      def levels_above
        @levels_above ||= level.levels_above
      end

      # The names and patterns the element renders the views the user moves to with: its level's, and, for a calendar
      # that drills up, those of the levels above too, and the page buttons' names on each, under `paging`.
      def i18n
        return level.i18n if levels_above.empty?

        levels = [level, *levels_above]
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
        heading = level.heading(@displayed_view)
        return heading if levels_above.empty?

        tag.button(heading, type: "button", class: "btn btn-sm btn-light #{tag_name}-heading-button", "aria-describedby": drill_hint_id(levels_above.first), disabled: @disabled)
      end

      # The hint describing the heading's button on the level below `level_above`, which the element names the same way
      # when it renders the heading again.
      def drill_hint_id(level_above)
        "#{@heading_id}-#{level_above.cell}"
      end

      # The value naming the selection, or a limit, that starts with `cell`, as the level writes its cells.
      def format_value(cell)
        level.format(cell)
      end

      # The earliest day `min` allows, or the latest `max` does: the first or last day of the cell it names.
      def to_limit(value, limit)
        date = to_date(value)
        return unless date

        range = level.range(level.cell_of(date))
        (limit == :max) ? range.end : range.begin
      end

      def find_time_zone(time_zone, value)
        return Time.find_zone!(time_zone) if time_zone.present?
        return value.time_zone if value.is_a?(ActiveSupport::TimeWithZone)

        Time.zone || Time.find_zone!("UTC")
      end

      # The calendar date `value` names in the calendar's time zone, or `nil` when it names none.
      def to_date(value)
        date =
          case value
          when ActiveSupport::TimeWithZone, Time, DateTime then value.in_time_zone(@time_zone).to_date
          when Date then value
          else level.parse(value, @time_zone)
          end
        date if date && YEARS.cover?(date.year)
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
        level.compare_views(cell, @displayed_view) != 0
      end

      # Paging stops at the views holding `min` and `max`, and never goes further from them than the displayed view.
      def previous_view_disabled?
        level.compare_views(@displayed_view, earliest) <= 0
      end

      def next_view_disabled?
        level.compare_views(@displayed_view, latest) >= 0
      end
    end
  end
end
