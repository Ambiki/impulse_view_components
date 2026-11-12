module Impulse
  module Internal
    # The day level: a month's days, in six weeks, under a row of weekday headings. The date and week calendars show
    # it. It is internal, and not part of the public API. A cell is named by its day, and a page by its month's first day.
    class DayLevel
      ISO_DATE = /\A\d{4}-\d{2}-\d{2}\z/
      # An ISO 8601 time, its date and time apart by a `T` or, as RFC 3339 allows, a space.
      ISO_TIME = /\A\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/

      attr_reader :first_day_of_week

      def initialize(first_day_of_week:)
        @first_day_of_week = first_day_of_week
      end

      # The word after the tag in a cell's class name.
      def cell
        "day"
      end

      # The grid's data attribute naming the displayed page.
      def page_attribute
        "month"
      end

      def format_page(page)
        page.strftime("%Y-%m")
      end

      # The day an ISO 8601 string names: `YYYY-MM-DD`, or a time, read in `time_zone` without an offset. `nil` for
      # anything else, as a looser date, such as `"11/12/2026"`, reads differently from one locale to another.
      def parse(value, time_zone)
        return unless value.is_a?(String)

        if ISO_DATE.match?(value)
          Date.iso8601(value)
        elsif ISO_TIME.match?(value)
          time_zone.iso8601(value.sub(" ", "T")).to_date
        end
      rescue ArgumentError
        nil
      end

      # A cell's value: the day, `YYYY-MM-DD`.
      def format(cell)
        cell.iso8601
      end

      def cell_of(date)
        date
      end

      # The days a cell covers: itself.
      def range(cell)
        cell..cell
      end

      def page_of(date)
        date.beginning_of_month
      end

      def compare_pages(a, b)
        page_of(a) <=> page_of(b)
      end

      # The first day of the week `date` falls in.
      def beginning_of_week(date)
        date.beginning_of_week(Date::DAYS_INTO_WEEK.key(first_day_of_week))
      end

      # The page's month as six weeks starting on the first day of the week, filled with days of the months before and
      # after, so the grid has the same height for every month.
      def rows(page)
        first = beginning_of_week(page)
        (first...(first + 42)).each_slice(7)
      end

      # The days of the week in the grid's order, as `Date#wday` counts them, for its weekday headings.
      def weekdays
        (0..6).map { |offset| (first_day_of_week + offset) % 7 }
      end

      def heading(page)
        I18n.l(page, format: month_heading_format)
      end

      def text(cell)
        cell.day
      end

      def label(cell)
        I18n.l(cell, format: day_format)
      end

      # The levels a calendar of days drills up to, nearest first (ADR 0017).
      def levels_above
        [MonthLevel.new, YearLevel.new]
      end

      def previous_label
        I18n.t("impulse.calendar.previous_month")
      end

      def next_label
        I18n.t("impulse.calendar.next_month")
      end

      # The names and patterns the element renders the months the user moves to with, so they read like this one.
      def i18n
        {
          monthNames: I18n.t("date.month_names").compact,
          abbrMonthNames: I18n.t("date.abbr_month_names").compact,
          dayNames: I18n.t("date.day_names"),
          abbrDayNames: I18n.t("date.abbr_day_names"),
          formats: { monthHeading: month_heading_format, day: day_format }
        }
      end

      private

      def month_heading_format
        I18n.t("impulse.calendar.formats.month_heading")
      end

      def day_format
        I18n.t("impulse.calendar.formats.day")
      end
    end
  end
end
