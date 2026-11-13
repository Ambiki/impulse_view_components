require "test_helper"

module Impulse
  class MonthCalendarComponentTest < ApplicationTest
    include ActiveSupport::Testing::TimeHelpers

    setup { travel_to Time.utc(2026, 11, 6, 13, 22) }
    teardown { travel_back }

    test "renders its value's year, three months to a row, named by their abbreviations" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "2026-03"))

      assert_selector "awc-month-calendar.awc-month-calendar[value='2026-03']"
      assert_selector "table[role='grid'][data-year='2026']"
      assert_selector "tbody tr", count: 4
      assert_equal %w[Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec], page.all("tbody button").map(&:text)
      refute_selector "button.awc-month-calendar-month--outside"
      assert_selector "button[data-date='2026-03-01'][aria-label='March 2026']"
    end

    test "marks the selected month, which holds the tab stop, and today's month" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "2026-03"))

      assert_selector "td[aria-selected='true']", count: 1
      assert_selector "td[aria-selected='true'] button[data-date='2026-03-01'][tabindex='0']", text: "Mar"
      assert_selector "button[aria-current='date']", count: 1
      assert_selector "button[aria-current='date'][data-date='2026-11-01']"
    end

    test "heads the grid with a button naming the year, which drills up to years, described by a hint" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "2026-03"))

      heading = page.find("[aria-live='polite']")
      assert_equal heading[:id], page.find("table[role='grid']")["aria-labelledby"]
      button = heading.find("button.btn.btn-sm.btn-light.awc-month-calendar-heading-button[type='button']", text: "2026")
      assert_selector "##{button["aria-describedby"]}.sr-only", text: "Choose a year", visible: :all
      assert_equal "2026", button.native.inner_html
      assert_selector ".awc-month-calendar-header[data-action='click->awc-month-calendar#handleHeadingClick']"
      assert_selector "button[aria-label='Previous year']"
      assert_selector "button[aria-label='Next year']"
    end

    test "reads a Date or a Time as its month in the calendar's time zone" do
      render_inline(Impulse::MonthCalendarComponent.new(value: Date.new(2031, 6, 18)))
      assert_selector "awc-month-calendar[value='2031-06']"
      assert_selector "table[data-year='2031']"

      # 11:00 UTC on November 30, 2026 is already December 1 in Kiritimati.
      render_inline(Impulse::MonthCalendarComponent.new(value: Time.utc(2026, 11, 30, 11), time_zone: "Pacific/Kiritimati"))
      assert_selector "awc-month-calendar[value='2026-12'][time-zone='Pacific/Kiritimati']"
    end

    test "renders the time zone and the names it renders months and years with, and no first day of the week" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "2026-11"))

      assert_selector "awc-month-calendar[time-zone='Etc/UTC']"
      refute_selector "awc-month-calendar[first-day-of-week]"
      refute_selector "thead"
      i18n = JSON.parse(page.find("awc-month-calendar")["i18n"])
      assert_equal Date::MONTHNAMES.compact, i18n["monthNames"]
      assert_equal Date::ABBR_MONTHNAMES.compact, i18n["abbrMonthNames"]
      assert_equal({ "month" => "%B %Y", "decade" => "%{start} – %{end}" }, i18n["formats"])
      assert_equal(
        {
          "month" => { "previous" => "Previous year", "next" => "Next year" },
          "year" => { "previous" => "Previous decade", "next" => "Next decade" }
        },
        i18n["paging"]
      )
    end

    test "disables the months outside min and max, which it renders as months, and stops paging at their years" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "2026-11", min: Date.new(2026, 3, 18), max: "2026-11"))

      assert_selector "awc-month-calendar[min='2026-03'][max='2026-11']"
      disabled = page.all("tbody button[aria-disabled='true']").map(&:text)
      assert_equal %w[Jan Feb Dec], disabled
      assert_selector "button[aria-label='Previous year'][aria-disabled='true']"
      assert_selector "button[aria-label='Next year'][aria-disabled='true']"
    end

    test "renders a value it can't read as given, with no selected month, on today's year" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "soon"))

      assert_selector "awc-month-calendar[value='soon']"
      assert_selector "table[data-year='2026']"
      refute_selector "td[aria-selected]"
      assert_selector "button[data-date='2026-11-01'][tabindex='0']"
    end

    test "reads only YYYY-MM months from strings, and no integer as one" do
      ["2026-11-18", "Nov 2026", "2026-13", "2026-00", "0999-01", "2026", 2026].each do |value|
        render_inline(Impulse::MonthCalendarComponent.new(value: value))

        assert_empty page.all("td[aria-selected]"), value.inspect
        assert_equal "2026", page.find("table")["data-year"], value.inspect
      end
    end

    test "takes no first day of the week, as it has no weeks" do
      assert_raises(ArgumentError) { Impulse::MonthCalendarComponent.new(value: "2026-11", first_day_of_week: :monday) }
    end

    test "disables the calendar, its grid and every button in it" do
      render_inline(Impulse::MonthCalendarComponent.new(value: "2026-11", disabled: true))

      assert_selector "awc-month-calendar[disabled]"
      assert_selector "table[role='grid'][aria-disabled='true']"
      refute_selector "button:not([disabled])"
    end
  end
end
