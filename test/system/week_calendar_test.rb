require "system/test_helper"

module Impulse
  class WeekCalendarSystemTest < ApplicationSystemTest
    # The element renders the months the user moves to, and the component the first one (ADR 0014). They must agree,
    # or the calendar would change the first time the user moves back to it.
    [
      ["weeks starting on Sunday", { value: "2026-11-18" }],
      ["weeks starting on Monday", { value: "2026-11-18", first_day_of_week: :monday }],
      ["a week that starts in the month before", { value: "2026-12-01" }],
      ["min and max, with disabled weeks", { value: "2026-11-18", min: "2026-11-11", max: "2026-11-25" }],
      ["today, without a value", { value: "", time_zone: "Pacific/Kiritimati" }]
    ].each do |description, params|
      test "renders the first month as the element renders it: #{description}" do
        visit_preview(:default, **params)
        server = calendar_markup

        find("button[aria-label='Next month']").click
        page.execute_script("document.querySelector('awc-week-calendar').resetView()")

        assert_equal server, calendar_markup
      end
    end

    test "describes the grid: choosing a day chooses its week" do
      visit_preview(:default, value: "2026-11-18")

      assert_equal "grid", find("table").native.aria_role
      assert_equal "November 2026", find("table").native.accessible_name
      assert_equal "Choosing a day chooses its week.", accessible_description("awc-week-calendar table")
      assert_equal "Wednesday, November 18, 2026", find("button[data-date='2026-11-18']").native.accessible_name
    end

    test "opens a popover on the selected week, and commits the week of the day clicked" do
      visit_preview(:in_popover)

      find("[data-test-id='week-trigger']").click
      assert_equal "2026-11-15", page.evaluate_script("document.activeElement.dataset.date")

      find("button[data-date='2026-11-25']").click

      assert_selector "awc-popover:not([open])"
      assert_selector "[data-test-id='week-trigger']", text: "Nov 22, 2026 - Nov 28, 2026"
      # The popover is closed, so the calendar inside it is hidden.
      assert_selector "awc-week-calendar[value='2026-11-22']", visible: :all
    end

    test "renders the days again as the component does after drilling up and back down" do
      visit_preview(:default, value: "2026-11-18")
      server = calendar_markup

      find(".awc-week-calendar-heading-button").click
      find("button[data-date='2026-11-01']").click

      assert_equal server, calendar_markup
    end

    test "drills up to the months in the same box, where choosing isn't described as choosing a week" do
      visit_preview(:default, value: "2026-11-18")
      days = page.evaluate_script("document.querySelector('awc-week-calendar').getBoundingClientRect().height")

      find(".awc-week-calendar-heading-button").click

      assert_nil accessible_description("awc-week-calendar table")
      assert_equal days, page.evaluate_script("document.querySelector('awc-week-calendar').getBoundingClientRect().height")

      find("button[data-date='2026-12-01']").click
      assert_equal "Choosing a day chooses its week.", accessible_description("awc-week-calendar table")
    end

    private

    # The parts of the calendar the element renders, without the whitespace between tags, which doesn't render.
    def calendar_markup
      page.evaluate_script(<<~JS)
        (() => {
          const el = document.querySelector('awc-week-calendar');
          const html = (node) => node.innerHTML.replace(/>\\s+</g, '><').trim();
          return {
            heading: html(el.querySelector('[aria-live]')),
            month: el.querySelector('table').dataset.month,
            weekdays: html(el.querySelector('thead')),
            days: html(el.querySelector('tbody')),
            paging: [...el.querySelectorAll('.awc-week-calendar-nav')].map((button) => button.getAttribute('aria-disabled')),
          };
        })()
      JS
    end
  end
end
