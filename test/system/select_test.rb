require "system/test_helper"

module Impulse
  class SelectSystemTest < ApplicationSystemTest
    test "required attribute is always present in single select" do
      visit_preview(:form_with_single_select, required: true)
      assert_selector "input[type='text'][required]"

      click_button "Clear"
      assert_selector "input[type='text'][required]"
    end

    test "required attribute is dynamically added based on if the options are selected or not" do
      visit_preview(:form_with_multiple_select, required: true)
      refute_selector "input[type='text'][required]"

      click_button "Clear"
      assert_selector "input[type='text'][required]"
    end

    test "no-options attribute is added when options are missing" do
      visit_preview(:custom_blankslate)

      page.find(".awc-autocomplete-control").click
      assert_selector "awc-autocomplete[no-options]"
      assert_selector ".awc-autocomplete-blankslate", text: "Nothing found"
    end

    test "resets input field when parent form resets" do
      visit_preview(:form_with_single_select)

      assert_equal "Banana", page.find_field("impulse_select_component_preview_user_fruit_id").value
      assert_selector "awc-autocomplete[value='2']"

      page.find(".awc-autocomplete-control").click
      page.find("[role='option'][value='3']").click
      assert_equal "Strawberry", page.find_field("impulse_select_component_preview_user_fruit_id").value
      assert_selector "awc-autocomplete[value='3']"

      click_button "Reset"
      assert_equal "Banana", page.find_field("impulse_select_component_preview_user_fruit_id").value
      assert_selector "awc-autocomplete[value='2']"
      assert_selector "[data-behavior='hidden-field'][value='2']", visible: false
    end

    test "resets tags when parent form resets" do
      visit_preview(:form_with_multiple_select)

      assert_selector "[data-behavior='tag']", count: 2
      assert_equal "2", page.all("[data-behavior='tag']").first["value"]
      assert_equal "3", page.all("[data-behavior='tag']").last["value"]

      page.find(".awc-autocomplete-control").click
      page.find("[role='option'][value='1']").click
      assert_selector "[data-behavior='tag']", count: 3
      page.find("body").click # Trigger a blur event to close the listbox.

      click_button "Reset"
      assert_selector "[data-behavior='tag']", count: 2
      assert_equal "2", page.all("[data-behavior='tag']").first["value"]
      assert_equal "3", page.all("[data-behavior='tag']").last["value"]
    end
  end
end
