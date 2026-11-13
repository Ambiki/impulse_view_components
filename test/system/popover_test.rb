require "system/test_helper"

module Impulse
  class PopoverSystemTest < ApplicationSystemTest
    test "opens the popover by clicking on the trigger button" do
      visit_preview(:default)

      assert_popover_close
      click_on "Toggle popover"

      assert_popover_open
    end

    test "focuses on the close button after opening the popover" do
      visit_preview(:default)

      click_on "Toggle popover"

      assert_equal page.evaluate_script("document.activeElement")["aria-label"], "Close"
    end

    test "closes the popover by clicking on the trigger button" do
      visit_preview(:default)

      click_on "Toggle popover"
      assert_popover_open

      click_on "Toggle popover"
      assert_popover_close
    end

    test "closes the popover by clicking on the close button" do
      visit_preview(:default)

      click_on "Toggle popover"
      assert_popover_open

      click_button class: "awc-popover-close-btn"
      assert_popover_close
    end

    test "keeps the close button at the end of the header" do
      visit_preview(:default)

      click_on "Toggle popover"

      header = find(".popover-header")
      button = find(".awc-popover-close-btn")
      header_end = header["offsetLeft"].to_i + header["offsetWidth"].to_i
      button_end = button["offsetLeft"].to_i + button["offsetWidth"].to_i

      assert_equal 8, header_end - button_end
    end

    test "outlines the close button on keyboard focus, which forced colors show without its focus ring" do
      visit_preview(:default)

      find_button("Toggle popover").send_keys(:enter)

      assert_selector ".awc-popover-close-btn:focus-visible"
      assert_equal "solid", find(".awc-popover-close-btn").style("outline-style")["outline-style"]
    end

    test "moves focus into the body when the title and the close button are hidden" do
      visit_preview(:hidden_header)

      click_on "Notifications"
      assert_popover_open
      refute_selector ".popover-header"
      assert_equal "email-notifications", page.active_element["id"]

      page.active_element.send_keys(:escape)
      assert_popover_close
      assert_equal "Notifications", page.active_element.text
    end

    test "closes the popover by clicking outside" do
      visit_preview(:default)

      click_on "Toggle popover"
      assert_popover_open

      page.find("body").click
      assert_popover_close
    end

    test "opens a nested popover" do
      visit_preview(:nested)

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"

      click_on "Open nested popover"
      assert_selector "[data-test-id='nested-popover']"
    end

    test "closes the popover and the ones nested in it on one click outside" do
      visit_preview(:nested)

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"

      click_on "Open nested popover"
      assert_selector "[data-test-id='nested-popover']"

      click_on "Outside button"
      refute_selector "[data-test-id='nested-popover']"
      refute_selector "[data-test-id='parent-popover']"
    end

    test "closes only the nested popover on a click inside the parent popover" do
      visit_preview(:nested)

      click_on "Open"
      click_on "Open nested popover"
      assert_selector "[data-test-id='nested-popover']"

      # The title, away from the nested popover's trigger in the body.
      find("h2", text: "Activity feed").click
      refute_selector "[data-test-id='nested-popover']"
      assert_selector "[data-test-id='parent-popover']"
    end

    test "closes all nested popovers when clicking on the parent popover's trigger button" do
      visit_preview(:nested)

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"

      click_on "Open nested popover"
      assert_selector "[data-test-id='nested-popover']"

      click_on "Open"
      refute_selector "[data-test-id='parent-popover']"

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"
      refute_selector "[data-test-id='nested-popover']"
    end

    test "closes all popovers when opening a non-related popover" do
      visit_preview(:nested)

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"

      click_on "Open nested popover"
      assert_selector "[data-test-id='nested-popover']"

      click_on "Event"
      refute_selector "[data-test-id='parent-popover']"
      refute_selector "[data-test-id='nested-popover']"
      assert_selector "[data-test-id='non-related-popover']"
    end

    test "closes on Escape and returns focus to the trigger" do
      visit_preview(:default)

      click_on "Toggle popover"
      assert_popover_open

      page.active_element.send_keys(:escape)
      assert_popover_close
      assert_equal "Toggle popover", page.active_element.text
    end

    test "closes when Tab moves focus out of it" do
      visit_preview(:nested)

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"
      assert_equal "Close", page.active_element["aria-label"]

      # Into the nested popover's trigger, which is inside the panel.
      page.active_element.send_keys(:tab)
      assert_equal "Open nested popover", page.active_element.text
      assert_selector "[data-test-id='parent-popover']"

      # Out of the panel, to the next popover's trigger.
      page.active_element.send_keys(:tab)
      assert_equal "Event", page.active_element.text
      refute_selector "[data-test-id='parent-popover']"
    end

    test "stays open when Shift+Tab moves focus back to the trigger" do
      visit_preview(:default)

      click_on "Toggle popover"
      page.active_element.send_keys([:shift, :tab])

      assert_equal "Toggle popover", page.active_element.text
      assert_popover_open
    end

    test "keeps working after being toggled rapidly" do
      visit_preview(:default)

      trigger = find_button("Toggle popover")
      50.times { trigger.click }
      assert_popover_close

      trigger.click
      assert_popover_open
      assert page.evaluate_script("document.querySelector('.awc-popover-container').matches(':popover-open')")
    end

    private

    def assert_popover_open
      assert_selector "awc-popover[open]"
    end

    def assert_popover_close
      refute_selector "awc-popover[open]"
    end
  end
end
