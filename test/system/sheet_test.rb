require "system/test_helper"

module Impulse
  class SheetSystemTest < ApplicationSystemTest
    test "opens the sheet against the right edge, filling the height" do
      visit_preview(:default)

      click_on "Open sheet"

      assert_selector "dialog"
      assert_equal({ "left" => viewport_width - 400, "width" => 400, "top" => 0, "height" => viewport_height }, sheet_layout)
    end

    test "leaves a strip of the backdrop on a phone, which closes the sheet when clicked" do
      page.current_window.resize_to(375, 667)
      visit_preview(:default)

      click_on "Open sheet"

      assert_selector "dialog"
      assert_equal viewport_width, sheet_layout["left"] + sheet_layout["width"]
      assert_operator sheet_layout["left"], :>, 20

      page.driver.browser.action.move_to_location(10, 300).click.perform
      refute_selector "dialog"
    ensure
      page.current_window.resize_to(1400, 1400)
    end

    test "fills the screen below the full-screen breakpoint" do
      page.current_window.resize_to(375, 667)
      visit_preview(:default, fullscreen: "sm_down")

      click_on "Open sheet"

      assert_selector "dialog"
      assert_equal({ "left" => 0, "width" => viewport_width, "top" => 0, "height" => viewport_height }, sheet_layout)
    ensure
      page.current_window.resize_to(1400, 1400)
    end

    private

    # Where the sheet's `<dialog>` is laid out, in pixels, which the transform that slides it in doesn't change.
    def sheet_layout
      evaluate_script(<<~JS)
        (() => {
          const dialog = document.querySelector('dialog');
          return { left: dialog.offsetLeft, width: dialog.offsetWidth, top: dialog.offsetTop, height: dialog.offsetHeight };
        })()
      JS
    end

    def viewport_width
      evaluate_script("document.documentElement.clientWidth")
    end

    def viewport_height
      evaluate_script("window.innerHeight")
    end
  end
end
