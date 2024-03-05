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

    test "closes the nested dialog without closing the parent dialog" do
      visit_preview(:nested_dialog)

      click_on "Open dialog"
      click_on "Open nested dialog"
      find("[data-test-id='nested-dialog-close-btn']").click

      refute_selector "[data-test-id='nested-dialog']"
      assert_selector "[data-test-id='parent-dialog']"
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
  end
end
