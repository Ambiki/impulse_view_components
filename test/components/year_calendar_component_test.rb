require "test_helper"

module Impulse
  class YearCalendarComponentTest < ApplicationTest
    include ActiveSupport::Testing::TimeHelpers

    setup { travel_to Time.utc(2026, 11, 6, 13, 22) }
    teardown { travel_back }

    test "renders its value's decade, with the year before and after it" do
      render_inline(Impulse::YearCalendarComponent.new(value: 2026))

      assert_selector "awc-year-calendar.awc-year-calendar[value='2026']"
      assert_selector "table[role='grid'][data-decade='2020']"
      assert_selector "tbody tr", count: 4
      assert_equal %w[2019 2020 2021 2022 2023 2024 2025 2026 2027 2028 2029 2030], page.all("tbody button").map(&:text)
      assert_selector "button.awc-year-calendar-year--outside", count: 2
      assert_selector "button.awc-year-calendar-year--outside", text: "2019"
      assert_selector "button.awc-year-calendar-year--outside", text: "2030"
      assert_selector "[aria-live='polite']", text: "2020 – 2029"
    end

    test "marks the selected year, which holds the tab stop, and today's year" do
      render_inline(Impulse::YearCalendarComponent.new(value: "2023"))

      assert_selector "td[aria-selected='true']", count: 1
      assert_selector "td[aria-selected='true'] button[data-date='2023-01-01'][tabindex='0']", text: "2023"
      assert_selector "button[aria-current='date']", count: 1
      assert_selector "button[aria-current='date']", text: "2026"
    end

    test "reads a Date or a Time as its year in the calendar's time zone" do
      render_inline(Impulse::YearCalendarComponent.new(value: Date.new(2031, 6, 1)))
      assert_selector "awc-year-calendar[value='2031']"
      assert_selector "table[data-decade='2030']"

      # 11:00 UTC on December 31, 2026 is already January 1, 2027 in Kiritimati.
      render_inline(Impulse::YearCalendarComponent.new(value: Time.utc(2026, 12, 31, 11), time_zone: "Pacific/Kiritimati"))
      assert_selector "awc-year-calendar[value='2027'][time-zone='Pacific/Kiritimati']"
    end

    test "renders the time zone and the decade pattern, and no first day of the week" do
      render_inline(Impulse::YearCalendarComponent.new(value: 2026))

      assert_selector "awc-year-calendar[time-zone='Etc/UTC']"
      refute_selector "awc-year-calendar[first-day-of-week]"
      refute_selector "thead"
      assert_equal({ "formats" => { "decade" => "%{start} – %{end}" } }, JSON.parse(page.find("awc-year-calendar")["i18n"]))
      assert_selector "button[aria-label='Previous decade']"
      assert_selector "button[aria-label='Next decade']"
    end

    test "disables the years outside min and max, which it renders as years, and stops paging at their decades" do
      render_inline(Impulse::YearCalendarComponent.new(value: 2026, min: Date.new(2022, 7, 1), max: "2028"))

      assert_selector "awc-year-calendar[min='2022'][max='2028']"
      disabled = page.all("tbody button[aria-disabled='true']").map(&:text)
      assert_equal %w[2019 2020 2021 2029 2030], disabled
      refute_selector "button[data-date='2022-01-01'][aria-disabled]"
      assert_selector "button[aria-label='Previous decade'][aria-disabled='true']"
      assert_selector "button[aria-label='Next decade'][aria-disabled='true']"
    end

    test "renders a value it can't read as given, with no selected year, on today's decade" do
      render_inline(Impulse::YearCalendarComponent.new(value: "soon"))

      assert_selector "awc-year-calendar[value='soon']"
      assert_selector "table[data-decade='2020']"
      refute_selector "td[aria-selected]"
      assert_selector "button[data-date='2026-01-01'][tabindex='0']"
    end

    test "reads only four-digit years from strings and integers, and nothing else as one" do
      ["20", "12345", "0999", "May 2026", 999, 10_000].each do |value|
        render_inline(Impulse::YearCalendarComponent.new(value: value))

        assert_empty page.all("td[aria-selected]"), value.inspect
        assert_equal "2020", page.find("table")["data-decade"], value.inspect
      end
    end

    test "disables the years past the four-digit ones, and stops paging at their decades" do
      render_inline(Impulse::YearCalendarComponent.new(value: 1005))
      assert_selector "button[data-date='0999-01-01'][aria-disabled='true']"
      assert_selector "button[aria-label='Previous decade'][aria-disabled='true']"

      render_inline(Impulse::YearCalendarComponent.new(value: 9995))
      assert_selector "button[data-date='10000-01-01'][aria-disabled='true']"
      assert_selector "button[aria-label='Next decade'][aria-disabled='true']"
    end

    test "takes no first day of the week, as it has no weeks" do
      assert_raises(ArgumentError) { Impulse::YearCalendarComponent.new(value: 2026, first_day_of_week: :monday) }
    end

    test "disables the calendar, its grid and every button in it" do
      render_inline(Impulse::YearCalendarComponent.new(value: 2026, disabled: true))

      assert_selector "awc-year-calendar[disabled]"
      assert_selector "table[role='grid'][aria-disabled='true']"
      refute_selector "button:not([disabled])"
    end
  end
end
