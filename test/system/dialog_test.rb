require "system/test_helper"

module Impulse
  class DialogSystemTest < ApplicationSystemTest
    test "opens the dialog by clicking on the button" do
      visit_preview(:default)

      refute_selector "dialog"
      click_on "Open dialog"

      assert_selector "dialog"
    end

    test "closes the dialog by clicking on the Close dialog button" do
      visit_preview(:default)

      click_on "Open dialog"
      assert_selector "dialog"

      click_button class: "awc-dialog-close-btn"
      refute_selector "dialog"
    end

    test "keeps its layout while it animates out" do
      visit_preview(:default)

      click_on "Open dialog"
      assert_selector "dialog"

      open_offset, closing_offset, closing_display = evaluate_async_script(<<~JS)
        const done = arguments[0];
        const dialog = document.querySelector('dialog');
        const bodyOffset = () => dialog.querySelector('.awc-dialog-body').offsetTop;
        const openOffset = bodyOffset();
        dialog.closest('awc-dialog').requestHide();
        requestAnimationFrame(() => done([openOffset, bodyOffset(), getComputedStyle(dialog).display]));
      JS

      assert_equal "flex", closing_display
      assert_operator open_offset, :>, 0
      assert_equal open_offset, closing_offset
      refute_selector "dialog"
    end

    test "closes the nested dialog without closing the parent dialog" do
      visit_preview(:nested_dialog)

      click_on "Open dialog"
      click_on "Open nested dialog"
      find("[data-test-id='nested-dialog-close-btn']").click

      refute_selector "[data-test-id='nested-dialog']"
      assert_selector "[data-test-id='parent-dialog']"
    end

    test "opens a dialog with no close button focused on its header's field" do
      visit_preview(:custom_header)

      click_on "Open dialog"

      assert_selector "dialog .awc-dialog-header input[type='search']:focus"
      refute_selector ".awc-dialog-close-btn"
      assert_equal({ "position" => "absolute", "width" => "1px" }, find("h2", text: "Command palette").style("position", "width"))
    end

    test "keeps the close button at the end of the header when the title is hidden" do
      visit_preview(:hidden_title)

      click_on "Open dialog"

      assert_equal 4, distance_from_end(".awc-dialog-close-btn", of: ".awc-dialog-header")
    end

    test "pads a header with no close button evenly" do
      visit_preview(:custom_header)

      click_on "Open dialog"

      assert_equal 16, distance_from_start("input[type='search']", of: ".awc-dialog-header")
      assert_equal 16, distance_from_end("input[type='search']", of: ".awc-dialog-header")
    end

    test "closes a dialog with no close button on Escape" do
      visit_preview(:custom_header)

      click_on "Open dialog"
      assert_selector "dialog"

      send_keys :escape
      refute_selector "dialog"
    end

    test "renders any arbitrary content inside the dialog" do
      visit_preview(:with_form)

      click_on "Open dialog"
      assert_selector ".awc-dialog-header"
      assert_selector "form.awc-dialog--scrollable" do
        assert_selector ".awc-dialog-body"
        assert_selector ".awc-dialog-footer"
      end
    end

    private

    # The pixels between the end of the element `selector` matches and the end of the element `of` matches, in the
    # layout, so that the animation that scales an opening dialog doesn't change them.
    def distance_from_end(selector, of:)
      start_offset(of) + find(of)["offsetWidth"].to_i - start_offset(selector) - find(selector)["offsetWidth"].to_i
    end

    # The pixels between the start of the element `of` matches and the start of the element `selector` matches.
    def distance_from_start(selector, of:)
      start_offset(selector) - start_offset(of)
    end

    def start_offset(selector)
      find(selector)["offsetLeft"].to_i
    end
  end
end
