require "system/test_helper"

module Impulse
  class AnchorSystemTest < ApplicationSystemTest
    test "flips and shifts, without auto size, by default" do
      visit_preview(:default)

      assert_equal({ "flip" => true, "shift" => true, "autoSize" => "" }, anchor_state)
      assert_equal "none", body_max_height
    end

    test "passes the viewport edge options to the element" do
      visit_preview(:default, flip: false, shift: false, auto_size: "height", auto_size_padding: 12)

      assert_equal({ "flip" => false, "shift" => false, "autoSize" => "height" }, anchor_state)
      assert_equal 12, page.evaluate_script("document.querySelector('awc-anchor').autoSizePadding")
    end

    test "caps the body to the space left in the viewport with auto size" do
      visit_preview(:default, auto_size: "height")

      assert_match(/\A\d+(\.\d+)?px\z/, body_max_height)
    end

    private

    def anchor_state
      assert_selector "awc-anchor[data-impulse-element]"
      page.evaluate_script(<<~JS)
        (() => {
          const anchor = document.querySelector('awc-anchor');
          return { flip: anchor.flip, shift: anchor.shift, autoSize: anchor.autoSize };
        })()
      JS
    end

    def body_max_height
      assert_selector "awc-anchor[data-impulse-element]"
      page.evaluate_script("getComputedStyle(document.querySelector('awc-anchor .popover-body')).maxHeight")
    end
  end
end
