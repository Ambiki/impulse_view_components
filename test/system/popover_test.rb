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

      click_button class: "close"
      assert_popover_close
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

    test "closes the popover in order when there are nested popovers when clicking outside" do
      visit_preview(:nested)

      click_on "Open"
      assert_selector "[data-test-id='parent-popover']"

      click_on "Open nested popover"
      assert_selector "[data-test-id='nested-popover']"

      click_on "Outside button"
      refute_selector "[data-test-id='nested-popover']"
      assert_selector "[data-test-id='parent-popover']"

      click_on "Outside button"
      refute_selector "[data-test-id='parent-popover']"
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

    private

    def assert_popover_open
      assert_selector "awc-popover[open]"
    end

    def assert_popover_close
      refute_selector "awc-popover[open]"
    end
  end
end
