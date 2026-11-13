require "system/test_helper"

module Impulse
  class DateCalendarSystemTest < ApplicationSystemTest
    # The element renders the months the user turns to, and the component the first one (ADR 0014). They must agree,
    # or the calendar would change the first time the user turns back to it.
    [
      ["a month starting on Sunday", { value: "2026-11-18" }],
      ["weeks starting on Monday", { value: "2026-11-18", first_day_of_week: :monday }],
      ["the 31st, which a page turn clamps", { value: "2026-01-31", first_day_of_week: :saturday }],
      ["min, max and disabled weekends", { value: "2026-11-18", min: "2026-11-10", max: "2026-11-25", disable_weekends: true }],
      ["today, without a value", { value: "", time_zone: "Pacific/Kiritimati" }]
    ].each do |description, params|
      test "renders the first month as the element renders it: #{description}" do
        visit_preview(:default, **params)
        server = calendar_markup

        find("button[aria-label='Next month']").click
        page.execute_script("document.querySelector('awc-date-calendar').resetView()")

        assert_equal server, calendar_markup
      end
    end

    test "renders a disabled calendar's first month as the element renders it" do
      visit_preview(:default, value: "2026-11-18", disabled: true)
      server = calendar_markup

      page.execute_script("const el = document.querySelector('awc-date-calendar'); el.nextView(); el.resetView()")

      assert_equal server, calendar_markup
      assert_equal "true", server["disabled"]
    end

    test "renders a disabled calendar's heading as the component does after code takes it back from a level drilled up to" do
      visit_preview(:default, value: "2026-11-18", disabled: true)
      server = calendar_markup

      page.execute_script(<<~JS)
        const el = document.querySelector('awc-date-calendar');
        el.disabled = false;
        el.querySelector('.awc-date-calendar-heading-button').click();
        el.disabled = true;
        el.resetView();
      JS

      assert_equal server, calendar_markup
    end

    test "names the grid by its month, and each day by its full date" do
      visit_preview(:default, value: "2026-11-18")

      grid = find("table")
      assert_equal "grid", grid.native.aria_role
      assert_equal "November 2026", grid.native.accessible_name
      day = find("button[data-date='2026-11-18']")
      assert_equal "button", day.native.aria_role
      assert_equal "Wednesday, November 18, 2026", day.native.accessible_name
      assert_equal "gridcell", find("td[aria-selected='true']").native.aria_role
    end

    test "commits a day from a popover, which closes, and opens back on the selected day" do
      visit_preview(:in_popover)

      find("[data-test-id='date-trigger']").click
      find("button[data-date='2026-11-20']").click

      assert_selector "awc-popover:not([open])"
      assert_selector "[data-test-id='date-trigger']", text: "November 20, 2026"

      find("[data-test-id='date-trigger']").click
      find("button[aria-label='Next month']").click
      assert_selector "[aria-live='polite']", text: "December 2026"
      find("[data-test-id='date-trigger']").send_keys(:escape)
      find("[data-test-id='date-trigger']").click

      assert_selector "[aria-live='polite']", text: "November 2026"
      assert_selector "td[aria-selected='true'] button[data-date='2026-11-20'][tabindex='0']"
    end

    test "opens a popover on the selected day, where the keys move through the grid" do
      visit_preview(:in_popover)

      find("[data-test-id='date-trigger']").click
      assert_equal "2026-11-18", page.evaluate_script("document.activeElement.dataset.date")

      page.send_keys(:page_down)

      assert_selector "[aria-live='polite']", text: "December 2026"
      assert_equal "2026-12-18", page.evaluate_script("document.activeElement.dataset.date")
    end

    test "moves through the days and commits one by keyboard" do
      visit_preview(:default, value: "2026-11-18")

      find("button[data-date='2026-11-18']").send_keys(:right, :down, :page_down)
      assert_equal "2026-12-26", page.evaluate_script("document.activeElement.dataset.date")

      page.send_keys(:enter)

      assert_selector "awc-date-calendar[value='2026-12-26']"
      assert_selector "td[aria-selected='true'] button[data-date='2026-12-26']"
    end

    test "renders the days again as the component does after drilling up and back down" do
      visit_preview(:default, value: "2026-11-18")
      server = calendar_markup

      find(".awc-date-calendar-heading-button").click
      find(".awc-date-calendar-heading-button").click
      find("button[data-date='2026-01-01']").click
      find("button[data-date='2026-11-01']").click

      assert_equal server, calendar_markup
      assert_equal "2026-11-18", page.evaluate_script("document.activeElement.dataset.date")
    end

    test "drills up to the months and the years in the same box, named by the heading and described" do
      visit_preview(:default, value: "2026-11-18")
      days = calendar_box
      assert_equal "Choose a month", accessible_description(".awc-date-calendar-heading-button")

      find(".awc-date-calendar-heading-button").click
      assert_equal "2026", find("table").native.accessible_name
      assert_equal "Choose a year", accessible_description(".awc-date-calendar-heading-button")
      assert_equal days, calendar_box

      find(".awc-date-calendar-heading-button").click
      assert_equal "2020 – 2029", find("table").native.accessible_name
      assert_equal days, calendar_box
    end

    test "drills up from a popover to change the year, then commits a day of the month chosen" do
      visit_preview(:in_popover)

      find("[data-test-id='date-trigger']").click
      find(".awc-date-calendar-heading-button").click
      find(".awc-date-calendar-heading-button").click
      find("button[data-date='2024-01-01']").click
      find("button[data-date='2024-03-01']").click
      find("button[data-date='2024-03-12']").click

      assert_selector "awc-popover:not([open])"
      assert_selector "awc-date-calendar[value='2024-03-12']", visible: :all
    end

    private

    # The size of the calendar and of its grid, which drilling up keeps.
    def calendar_box
      page.evaluate_script(<<~JS)
        (() => {
          const box = (node) => { const rect = node.getBoundingClientRect(); return [rect.width, rect.height]; };
          const el = document.querySelector('awc-date-calendar');
          return { calendar: box(el), grid: box(el.querySelector('table')) };
        })()
      JS
    end

    # The parts of the calendar the element renders, without the whitespace between tags, which doesn't render.
    def calendar_markup
      page.evaluate_script(<<~JS)
        (() => {
          const el = document.querySelector('awc-date-calendar');
          const html = (node) => node.innerHTML.replace(/>\\s+</g, '><').trim();
          return {
            heading: html(el.querySelector('[aria-live]')),
            month: el.querySelector('table').dataset.month,
            disabled: el.querySelector('table').getAttribute('aria-disabled'),
            weekdays: html(el.querySelector('thead')),
            days: html(el.querySelector('tbody')),
            paging: [...el.querySelectorAll('.awc-date-calendar-nav')].map((button) => [button.getAttribute('aria-label'), button.getAttribute('aria-disabled'), button.disabled]),
          };
        })()
      JS
    end
  end
end
