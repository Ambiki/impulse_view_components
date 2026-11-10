require "test_helper"

module Impulse
  class WeekCalendarComponentTest < ApplicationTest
    include ActiveSupport::Testing::TimeHelpers

    setup { travel_to Time.utc(2026, 11, 6, 13, 22) }
    teardown { travel_back }

    test "renders the week a day falls in, named by its first day" do
      render_inline(Impulse::WeekCalendarComponent.new(value: Date.new(2026, 11, 4), first_day_of_week: :sunday))

      assert_selector "awc-week-calendar.awc-week-calendar[value='2026-11-01']"
      selected = page.all("td[aria-selected='true'] button").map { |button| button["data-date"] }
      assert_equal %w[2026-11-01 2026-11-02 2026-11-03 2026-11-04 2026-11-05 2026-11-06 2026-11-07], selected
    end

    test "reads the week from the first day of the week" do
      # Wednesday, November 4, in weeks starting on Monday.
      render_inline(Impulse::WeekCalendarComponent.new(value: "2026-11-04", first_day_of_week: :monday))

      assert_selector "awc-week-calendar[value='2026-11-02'][first-day-of-week='1']"
      assert_equal "2026-11-02", page.first("td[aria-selected='true'] button")["data-date"]
      assert_equal "2026-11-08", page.all("td[aria-selected='true'] button").last["data-date"]
    end

    test "opens on the month of the week's first day, which holds the tab stop" do
      # Tuesday, December 1 is in the week of Sunday, November 29.
      render_inline(Impulse::WeekCalendarComponent.new(value: Date.new(2026, 12, 1), first_day_of_week: :sunday))

      assert_selector "awc-week-calendar[value='2026-11-29']"
      assert_selector "table[data-month='2026-11']"
      assert_selector "button[data-date='2026-11-29'][tabindex='0']"
      assert_selector "td[aria-selected='true']", count: 7
    end

    test "disables only the weeks with no day between min and max" do
      # With weeks from Sunday: min is Wednesday, November 11, and max is Wednesday, November 18.
      render_inline(Impulse::WeekCalendarComponent.new(
        value: Date.new(2026, 11, 11), min: Date.new(2026, 11, 11), max: Date.new(2026, 11, 18), first_day_of_week: :sunday
      ))

      disabled = page.all("tbody button[aria-disabled='true']").map { |button| button["data-date"] }
      # November 1 to 7, before min, and November 22 to December 12, after max.
      assert_equal 7 + 21, disabled.size
      assert_includes disabled, "2026-11-07"
      assert_includes disabled, "2026-11-22"
      # The days of the weeks min and max fall in aren't disabled, even those before min or after max.
      refute_selector "button[data-date='2026-11-08'][aria-disabled]"
      refute_selector "button[data-date='2026-11-21'][aria-disabled]"
    end

    test "describes the grid with a hint that choosing a day chooses its week" do
      render_inline(Impulse::WeekCalendarComponent.new(value: Date.new(2026, 11, 4)))

      hint_id = page.find("table[role='grid']")["aria-describedby"]
      assert hint_id.present?
      assert_selector "##{hint_id}.sr-only", text: "Choosing a day chooses its week.", visible: :all
      # Each day keeps its full date as its name.
      assert_selector "button[data-date='2026-11-04'][aria-label='Wednesday, November 4, 2026']"
    end

    test "drills up from its heading as the date calendar does, keeping its grid's hint apart" do
      render_inline(Impulse::WeekCalendarComponent.new(value: Date.new(2026, 11, 4)))

      heading = page.find("[aria-live='polite']")
      assert_equal "#{heading[:id]}-month", heading.find("button.awc-week-calendar-heading-button")["aria-describedby"]
      assert_selector "##{heading[:id]}-month", text: "Choose a month", visible: :all
      assert_selector "##{heading[:id]}-year", text: "Choose a year", visible: :all
      assert_selector "##{page.find("table[role='grid']")["aria-describedby"]}", text: "Choosing a day chooses its week.", visible: :all
      assert_equal %w[day month year], JSON.parse(page.find("awc-week-calendar")["i18n"])["paging"].keys
    end
  end
end
