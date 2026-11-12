module Impulse
  module Internal
    # The year level: a decade's years, and the year before and after it, three to a row. The year calendar shows it.
    # It is internal, and not part of the public API. A cell is named by its year's first day, and a page by its
    # decade's.
    class YearLevel
      def cell
        "year"
      end

      def page_attribute
        "decade"
      end

      def format_page(page)
        page.year.to_s
      end

      # The January 1 of the year an `Integer` or a four-digit string names, or `nil` for anything else.
      def parse(value, _time_zone)
        case value
        when Integer then Date.new(value, 1, 1)
        when /\A\d{4}\z/ then Date.new(value.to_i, 1, 1)
        end
      end

      # A cell's value: its year, `YYYY`.
      def format(cell)
        cell.year.to_s
      end

      def cell_of(date)
        Date.new(date.year, 1, 1)
      end

      # The days a cell covers: its year's.
      def range(cell)
        cell..cell.end_of_year
      end

      def page_of(date)
        Date.new(date.year.floor(-1), 1, 1)
      end

      def compare_pages(a, b)
        page_of(a) <=> page_of(b)
      end

      # The decade's ten years, and the years before and after it, three to a row.
      def rows(page)
        ((page.year - 1)..(page.year + 10)).map { |year| Date.new(year, 1, 1) }.each_slice(3)
      end

      def weekdays
        nil
      end

      def heading(page)
        I18n.t("impulse.calendar.formats.decade", start: page.year, end: page.year + 9)
      end

      def text(cell)
        cell.year
      end

      # A year's text names it.
      def label(_cell)
        nil
      end

      # A calendar of years drills up to no level.
      def levels_above
        []
      end

      def previous_label
        I18n.t("impulse.calendar.previous_decade")
      end

      def next_label
        I18n.t("impulse.calendar.next_decade")
      end

      # Describes the heading's button on the level below, which drills up to years.
      def drill_hint
        I18n.t("impulse.calendar.choose_year")
      end

      # The pattern the element names the decades the user moves to with.
      def i18n
        { formats: { decade: I18n.t("impulse.calendar.formats.decade") } }
      end
    end
  end
end
