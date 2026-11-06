require "test_helper"

module Impulse
  class DateCalendarComponentTest < ApplicationTest
    include ActiveSupport::Testing::TimeHelpers

    setup { travel_to Time.utc(2026, 11, 6, 13, 22) }
    teardown do
      travel_back
      I18n.reload!
    end

    test "renders the month of its value as six weeks" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18), first_day_of_week: :sunday))

      assert_selector "awc-date-calendar.awc-date-calendar[value='2026-11-18']"
      assert_selector "table[role='grid'][data-month='2026-11'] tbody tr", count: 6
      assert_selector "tbody tr", count: 6 do |week|
        week.assert_selector "td", count: 7
      end
      # November 2026 starts on a Sunday, so the grid runs from November 1 to December 12.
      assert_equal "2026-11-01", page.first("tbody button")["data-date"]
      assert_equal "2026-12-12", page.all("tbody button").last["data-date"]
    end

    test "sends the time zone as an IANA name, from Time.zone by default" do
      Time.use_zone("Eastern Time (US & Canada)") do
        render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6)))
      end

      assert_selector "awc-date-calendar[time-zone='America/New_York']"
    end

    test "reads a time in the zone of a TimeWithZone value, which becomes the calendar's zone" do
      # 03:00 UTC on November 7 is still November 6 in New York.
      value = Time.utc(2026, 11, 7, 3).in_time_zone("America/New_York")

      render_inline(Impulse::DateCalendarComponent.new(value: value))

      assert_selector "awc-date-calendar[value='2026-11-06'][time-zone='America/New_York']"
    end

    test "reads every time in the time_zone argument, over the value's own zone" do
      value = Time.utc(2026, 11, 7, 3).in_time_zone("America/New_York")

      render_inline(Impulse::DateCalendarComponent.new(value: value, time_zone: "Asia/Dubai"))

      assert_selector "awc-date-calendar[value='2026-11-07'][time-zone='Asia/Dubai']"
    end

    test "reads a plain Time, and a string with a time, in Time.zone" do
      Time.use_zone("Pacific Time (US & Canada)") do
        render_inline(Impulse::DateCalendarComponent.new(value: Time.utc(2026, 11, 7, 3)))
        assert_selector "awc-date-calendar[value='2026-11-06'][time-zone='America/Los_Angeles']"

        render_inline(Impulse::DateCalendarComponent.new(value: "2026-11-07T03:00:00Z"))
        assert_selector "awc-date-calendar[value='2026-11-06']"

        # A time without an offset is a time in the zone, as `Time.zone.parse` reads it.
        render_inline(Impulse::DateCalendarComponent.new(value: "2026-11-07 03:00:00"))
        assert_selector "awc-date-calendar[value='2026-11-07']"
      end
    end

    test "takes a YYYY-MM-DD string as the day it names" do
      render_inline(Impulse::DateCalendarComponent.new(value: "2026-02-28"))

      assert_selector "awc-date-calendar[value='2026-02-28']"
      assert_selector "table[data-month='2026-02']"
    end

    test "renders a value it can't read as given, with no selected day, on today's month" do
      render_inline(Impulse::DateCalendarComponent.new(value: "2026-02-30"))

      assert_selector "awc-date-calendar[value='2026-02-30']"
      assert_selector "table[data-month='2026-11']"
      refute_selector "td[aria-selected]"
    end

    test "shows today's month in the calendar's zone without a value" do
      # 13:22 UTC on October 31 is already November 1 in Kiritimati.
      travel_to Time.utc(2026, 10, 31, 13, 22)
      render_inline(Impulse::DateCalendarComponent.new(time_zone: "Pacific/Kiritimati"))

      refute_selector "awc-date-calendar[value]"
      assert_selector "table[data-month='2026-11']"
    end

    test "always renders the first day of the week, from Date.beginning_of_week" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6)))
      # Rails' default, as the test app doesn't set `config.beginning_of_week`.
      assert_selector "awc-date-calendar[first-day-of-week='1']"
      assert_equal "Monday", page.first("thead th")["abbr"]

      begin
        Date.beginning_of_week = :sunday
        render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6)))
      ensure
        Date.beginning_of_week = Date.beginning_of_week_default
      end
      assert_selector "awc-date-calendar[first-day-of-week='0']"
      assert_equal "Sunday", page.first("thead th")["abbr"]
    end

    test "takes the first day of the week as a day name or a number" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6), first_day_of_week: :saturday))
      assert_selector "awc-date-calendar[first-day-of-week='6']"

      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6), first_day_of_week: 0))
      assert_selector "awc-date-calendar[first-day-of-week='0']"
      assert_equal "2026-11-01", page.first("tbody button")["data-date"]
    end

    test "raises for something that isn't a day of the week" do
      assert_raises(ArgumentError) { Impulse::DateCalendarComponent.new(first_day_of_week: 7) }
      assert_raises(ArgumentError) { Impulse::DateCalendarComponent.new(first_day_of_week: :someday) }
      assert_raises(ArgumentError) { Impulse::DateCalendarComponent.new(disabled_days_of_week: [nil]) }
    end

    test "heads each column with its weekday, abbreviated, from the first day of the week" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6), first_day_of_week: :sunday))

      headings = page.all("thead th[scope='col']")
      assert_equal %w[Sun Mon Tue Wed Thu Fri Sat], headings.map(&:text)
      assert_equal %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday], headings.map { |th| th["abbr"] }
    end

    test "names the month and each day in full, and labels the page buttons" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6)))

      assert_selector "[aria-live='polite']", text: "November 2026"
      heading_id = page.find("[aria-live='polite']")["id"]
      assert_selector "table[role='grid'][aria-labelledby='#{heading_id}']"
      assert_selector "button[data-date='2026-11-06'][aria-label='Friday, November 6, 2026']", text: "6"
      assert_selector "button[aria-label='Previous month']"
      assert_selector "button[aria-label='Next month']"
    end

    test "passes the names and patterns to the element, for the months it renders" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6)))

      i18n = JSON.parse(page.find("awc-date-calendar")["i18n"])
      assert_equal %w[January February March April May June July August September October November December], i18n["monthNames"]
      assert_equal %w[Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec], i18n["abbrMonthNames"]
      assert_equal %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday], i18n["dayNames"]
      assert_equal %w[Sun Mon Tue Wed Thu Fri Sat], i18n["abbrDayNames"]
      assert_equal({ "heading" => "%B %Y", "day" => "%A, %B %-d, %Y" }, i18n["formats"])
    end

    test "uses the app's translations" do
      # Loads the translation files first, which would otherwise be loaded on the first lookup, over these.
      I18n.backend.eager_load!
      I18n.backend.store_translations(:en, impulse: { date_calendar: {
        previous_month: "Earlier",
        formats: { heading: "%b %Y", day: "%-d %B %Y" }
      } })

      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 6)))

      assert_selector "[aria-live='polite']", text: "Nov 2026"
      assert_selector "button[data-date='2026-11-06'][aria-label='6 November 2026']"
      assert_selector "button[aria-label='Earlier']"
      assert_equal({ "heading" => "%b %Y", "day" => "%-d %B %Y" }, JSON.parse(page.find("awc-date-calendar")["i18n"])["formats"])
    end

    test "marks the selected day, and makes it the one tab stop" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18)))

      assert_selector "td[aria-selected='true']", count: 1
      assert_selector "td[aria-selected='true'] button[data-date='2026-11-18'][tabindex='0']"
      assert_selector "tbody button[tabindex='0']", count: 1
      assert_selector "tbody button[tabindex='-1']", count: 41
    end

    test "marks today in the calendar's zone, and makes it the tab stop without a value" do
      # 13:22 UTC on November 6 is already November 7 in Kiritimati.
      render_inline(Impulse::DateCalendarComponent.new(time_zone: "Pacific/Kiritimati"))

      assert_selector "button[aria-current='date']", count: 1
      assert_selector "button[data-date='2026-11-07'][aria-current='date'][tabindex='0']"
      refute_selector "td[aria-selected]"
    end

    test "marks the days of the months before and after as outside days" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18), first_day_of_week: :monday))

      assert_selector "button.awc-date-calendar-day", count: 42
      assert_selector "button.awc-date-calendar-day--outside", count: 12
      assert_selector "button.awc-date-calendar-day--outside[data-date='2026-10-26']"
      assert_selector "button.awc-date-calendar-day--outside[data-date='2026-12-06']"
      refute_selector "button.awc-date-calendar-day--outside[data-date='2026-11-01']"
    end

    test "disables the days before min and after max, which it renders as calendar dates" do
      render_inline(Impulse::DateCalendarComponent.new(
        value: Date.new(2026, 11, 18),
        min: Date.new(2026, 11, 10),
        max: Time.utc(2026, 11, 20, 12)
      ))

      assert_selector "awc-date-calendar[min='2026-11-10'][max='2026-11-20']"
      assert_selector "button[data-date='2026-11-09'][aria-disabled='true']"
      refute_selector "button[data-date='2026-11-10'][aria-disabled]"
      refute_selector "button[data-date='2026-11-20'][aria-disabled]"
      assert_selector "button[data-date='2026-11-21'][aria-disabled='true']"
      # Disabled days stay reachable by keyboard, which a disabled button isn't.
      refute_selector "button[disabled]"
    end

    test "stops paging at the months holding min and max" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18), min: "2026-11-10", max: "2027-01-05"))

      assert_selector "button[aria-label='Previous month'][aria-disabled='true']"
      assert_selector "button[aria-label='Next month'][aria-disabled='false']"

      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2027, 1, 2), min: "2026-11-10", max: "2027-01-05"))

      assert_selector "button[aria-label='Previous month'][aria-disabled='false']"
      assert_selector "button[aria-label='Next month'][aria-disabled='true']"
    end

    test "shows a value outside min and max, and pages only back toward them" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 8, 1), min: "2026-11-10"))

      assert_selector "td[aria-selected='true'] button[data-date='2026-08-01'][aria-disabled='true']"
      assert_selector "button[aria-label='Previous month'][aria-disabled='true']"
      assert_selector "button[aria-label='Next month'][aria-disabled='false']"
    end

    test "disables the days of the week it is given" do
      render_inline(Impulse::DateCalendarComponent.new(
        value: Date.new(2026, 11, 18),
        disabled_days_of_week: [:saturday, 0],
        first_day_of_week: :sunday
      ))

      assert_selector "awc-date-calendar[disabled-days-of-week='[0,6]']"
      # 42 days from Sunday, November 1, or six of each weekday.
      assert_selector "button[aria-disabled='true']", count: 12
      assert_selector "button[data-date='2026-11-07'][aria-disabled='true']"
      assert_selector "button[data-date='2026-11-08'][aria-disabled='true']"
      refute_selector "button[data-date='2026-11-09'][aria-disabled]"
    end

    test "renders min, max and disabled days of the week only when given" do
      render_inline(Impulse::DateCalendarComponent.new(value: Date.new(2026, 11, 18)))

      refute_selector "awc-date-calendar[min]"
      refute_selector "awc-date-calendar[max]"
      refute_selector "awc-date-calendar[disabled-days-of-week]"
      refute_selector "tbody button[aria-disabled]"
      assert_selector "button.awc-date-calendar-nav[aria-disabled='false']", count: 2
    end
  end
end
