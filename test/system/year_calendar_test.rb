require "system/test_helper"

module Impulse
  class YearCalendarSystemTest < ApplicationSystemTest
    # The element renders the decades the user moves to, and the component the first one (ADR 0014). They must agree,
    # or the calendar would change the first time the user moves back to it.
    [
      ["a decade", { value: "2026" }],
      ["a year ending in 0", { value: "2030" }],
      ["min and max, with disabled years", { value: "2026", min: "2022", max: "2028" }],
      ["today, without a value", { value: "", time_zone: "Pacific/Kiritimati" }]
    ].each do |description, params|
      test "renders the first decade as the element renders it: #{description}" do
        visit_preview(:default, **params)
        server = calendar_markup

        find("button[aria-label='Next decade']").click
        page.execute_script("document.querySelector('awc-year-calendar').resetView()")

        assert_equal server, calendar_markup
      end
    end

    test "names the grid by its decade, and each year by its text" do
      visit_preview(:default, value: "2026")

      assert_equal "grid", find("table").native.aria_role
      assert_equal "2020 – 2029", find("table").native.accessible_name
      assert_equal "2023", find("button[data-date='2023-01-01']").native.accessible_name
    end

    test "is as wide as the date calendar, with its outer years at the grid's sides" do
      visit "/components/preview/impulse/date_calendar/default?value=2026-11-18"
      date_width = grid_box["grid"].first

      visit_preview(:default, value: "2026")

      box = grid_box
      assert_equal date_width, box["grid"].first
      assert_equal [0, 0], box["edges"]
    end

    test "opens a popover on the selected year, and commits the year clicked" do
      visit_preview(:in_popover)

      find("[data-test-id='year-trigger']").click
      assert_equal "2026", page.evaluate_script("document.activeElement.textContent")

      find("button[data-date='2024-01-01']").click

      assert_selector "awc-popover:not([open])"
      assert_selector "[data-test-id='year-trigger']", text: "2024"
    end

    private

    # The parts of the calendar the element renders, without the whitespace between tags, which doesn't render.
    def calendar_markup
      page.evaluate_script(<<~JS)
        (() => {
          const el = document.querySelector('awc-year-calendar');
          const html = (node) => node.innerHTML.replace(/>\\s+</g, '><').trim();
          return {
            heading: el.querySelector('[aria-live]').textContent,
            decade: el.querySelector('table').dataset.decade,
            years: html(el.querySelector('tbody')),
            paging: [...el.querySelectorAll('.awc-year-calendar-nav')].map((button) => button.getAttribute('aria-disabled')),
          };
        })()
      JS
    end

    # The size of the grid, and how far its first row's outer cells sit from its sides.
    def grid_box
      page.evaluate_script(<<~JS)
        (() => {
          const calendar = document.querySelector('[class$="-calendar"]');
          const grid = calendar.querySelector('table').getBoundingClientRect();
          const cells = [...calendar.querySelectorAll('tbody tr:first-child button')].map((button) => button.getBoundingClientRect());
          return {
            grid: [grid.width, grid.height],
            edges: [cells[0].left - grid.left, grid.right - cells[cells.length - 1].right],
          };
        })()
      JS
    end
  end
end
