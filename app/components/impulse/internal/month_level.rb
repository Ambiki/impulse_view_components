module Impulse
  module Internal
    # The month level: a year's twelve months, three to a row. The month calendar shows it. It is internal, and not part
    # of the public API. A cell is named by its month's first day, and a page by its year's.
    class MonthLevel
      MONTH = /\A(\d{4})-(0[1-9]|1[0-2])\z/

      def cell
        "month"
      end

      def page_attribute
        "year"
      end

      def format_page(page)
        page.year.to_s
      end

      # The first day of the month a `YYYY-MM` string names, or `nil` for anything else.
      def parse(value, _time_zone)
        match = MONTH.match(value) if value.is_a?(String)
        match && Date.new(match[1].to_i, match[2].to_i, 1)
      end

      # A cell's value: its month, `YYYY-MM`.
      def format(cell)
        cell.strftime("%Y-%m")
      end

      def cell_of(date)
        date.beginning_of_month
      end

      # The days a cell covers: its month's.
      def range(cell)
        cell..cell.end_of_month
      end

      def page_of(date)
        date.beginning_of_year
      end

      def compare_pages(a, b)
        a.year <=> b.year
      end

      # The year's twelve months, three to a row.
      def rows(page)
        (1..12).map { |month| Date.new(page.year, month, 1) }.each_slice(3)
      end

      def weekdays
        nil
      end

      def heading(page)
        page.year.to_s
      end

      def text(cell)
        I18n.t("date.abbr_month_names")[cell.month]
      end

      # A month's text has no year, which its name gives.
      def label(cell)
        I18n.l(cell, format: month_format)
      end

      # The levels a calendar of months drills up to (ADR 0017).
      def levels_above
        [YearLevel.new]
      end

      def previous_label
        I18n.t("impulse.calendar.previous_year")
      end

      def next_label
        I18n.t("impulse.calendar.next_year")
      end

      # Describes the heading's button on the level below, which drills up to months.
      def drill_hint
        I18n.t("impulse.calendar.choose_month")
      end

      # The names and pattern the element renders the years the user moves to with, so they read like this one.
      def i18n
        {
          monthNames: I18n.t("date.month_names").compact,
          abbrMonthNames: I18n.t("date.abbr_month_names").compact,
          formats: { month: month_format }
        }
      end

      private

      def month_format
        I18n.t("impulse.calendar.formats.month")
      end
    end
  end
end
