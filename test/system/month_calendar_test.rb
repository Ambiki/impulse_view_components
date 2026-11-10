require "system/test_helper"

module Impulse
  class MonthCalendarSystemTest < ApplicationSystemTest
    # The element renders the years the user moves to, and the component the first one (ADR 0014). They must agree,
    # or the calendar would change the first time the user moves back to it.
    [
      ["a year", { value: "2026-11" }],
      ["min and max, with disabled months", { value: "2026-11", min: "2026-03", max: "2026-11" }],
      ["today, without a value", { value: "", time_zone: "Pacific/Kiritimati" }]
    ].each do |description, params|
      test "renders the first year as the element renders it: #{description}" do
        visit_preview(:default, **params)
        server = calendar_markup

        find("button[aria-label='Next year']").click
        page.execute_script("document.querySelector('awc-month-calendar').resetView()")

        assert_equal server, calendar_markup
      end
    end

    test "renders the heading again as the component does after drilling up and back down" do
      visit_preview(:default, value: "2026-11")
      server = calendar_markup

      find(".awc-month-calendar-heading-button").click
      find("button[data-date='2026-01-01']").click

      assert_equal server, calendar_markup
    end

    test "names the grid by its year, each month by its month and year, and describes the heading's button" do
      visit_preview(:default, value: "2026-11")

      assert_equal "grid", find("table").native.aria_role
      assert_equal "2026", find("table").native.accessible_name
      assert_equal "November 2026", find("button[data-date='2026-11-01']").native.accessible_name
      assert_equal "2026", find(".awc-month-calendar-heading-button").native.accessible_name
      assert_equal "Choose a year", accessible_description(".awc-month-calendar-heading-button")
    end

    test "drills up to the years, named by their decade, and keeps its size" do
      visit_preview(:default, value: "2026-11")
      months = grid_box

      find(".awc-month-calendar-heading-button").click

      assert_equal "2026", page.evaluate_script("document.activeElement.textContent")
      assert_equal "2020 – 2029", find("table").native.accessible_name
      assert_equal months, grid_box
    end

    test "is as wide as the date calendar, with its outer months at the grid's sides" do
      visit "/components/preview/impulse/date_calendar/default?value=2026-11-18"
      date_width = grid_box["grid"].first

      visit_preview(:default, value: "2026-11")

      box = grid_box
      assert_equal date_width, box["grid"].first
      assert_equal [0, 0], box["edges"]
    end

    test "opens a popover on the selected month, drills up to change the year, and commits the month clicked" do
      visit_preview(:in_popover)

      find("[data-test-id='month-trigger']").click
      assert_equal "2026-11-01", page.evaluate_script("document.activeElement.dataset.date")

      find(".awc-month-calendar-heading-button").click
      find("button[data-date='2024-01-01']").click
      assert_equal "2024-11-01", page.evaluate_script("document.activeElement.dataset.date")
      find("button[data-date='2024-03-01']").click

      assert_selector "awc-popover:not([open])"
      assert_selector "[data-test-id='month-trigger']", text: "Mar 2024"
    end

    test "goes back to the selected month's year when the popover closes while drilled up" do
      visit_preview(:in_popover)

      find("[data-test-id='month-trigger']").click
      find(".awc-month-calendar-heading-button").click
      find("button[aria-label='Next decade']").click
      page.send_keys(:escape)

      assert_selector "awc-popover:not([open])"
      assert_selector "awc-month-calendar table[data-year='2026']", visible: :all
    end

    private

    # The parts of the calendar the element renders, without the whitespace between tags, which doesn't render.
    def calendar_markup
      page.evaluate_script(<<~JS)
        (() => {
          const el = document.querySelector('awc-month-calendar');
          const html = (node) => node.innerHTML.replace(/>\\s+</g, '><').trim();
          return {
            heading: html(el.querySelector('[aria-live]')),
            year: el.querySelector('table').dataset.year,
            months: html(el.querySelector('tbody')),
            paging: [...el.querySelectorAll('.awc-month-calendar-nav')].map((button) => [button.getAttribute('aria-label'), button.getAttribute('aria-disabled')]),
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

    # The description Chrome's accessibility tree gives the element `selector` matches, which a screen reader reads.
    def accessible_description(selector)
      browser = page.driver.browser
      document = browser.execute_cdp("DOM.getDocument")
      node = browser.execute_cdp("DOM.querySelector", nodeId: document["root"]["nodeId"], selector: selector)
      tree = browser.execute_cdp("Accessibility.getPartialAXTree", nodeId: node["nodeId"], fetchRelatives: false)
      tree["nodes"].first.dig("description", "value")
    end
  end
end
