require "system/test_helper"

module Impulse
  class AutocompleteSystemTest < ApplicationSystemTest
    test "opens the listbox by clicking on the control" do
      visit_preview(:single_select)
      page.find(".awc-autocomplete-control").click

      assert_selector "awc-autocomplete[open]"
      assert_selector "[role='listbox']"
    end

    test "activates the selected option after opening the listbox" do
      visit_preview(:single_select)
      page.find(".awc-autocomplete-control").click

      assert_selector "[role='option'][value='banana'][data-active]"
      assert_selector "[role='option'][value='banana'][aria-selected='true']"
    end

    test "selects an option" do
      visit_preview(:single_select)
      page.find(".awc-autocomplete-control").click
      page.find("[role='option'][value='kiwi']").click

      assert_selector "awc-autocomplete[value='kiwi']"
      assert_equal "Kiwi", page.find_field("user_fruit_id").value
      assert_selector "[data-behavior='hidden-field'][value='kiwi']", visible: false
      assert_selector "[data-behavior='hidden-field'][data-text='Kiwi']", visible: false
      # Closes the listbox after selecting an option
      refute_selector "[role='listbox']"
    end

    test "appends tags after selecting an option" do
      visit_preview(:multiple_select)

      refute_selector "[data-behavior='tag'][value='kiwi']"
      page.find(".awc-autocomplete-control").click
      page.find("[role='option'][value='kiwi']").click

      assert_selector "[data-behavior='tag'][value='kiwi']" do
        assert_selector "[data-behavior='hidden-field'][value='kiwi']", visible: false
      end
      assert_equal ["apple", "mango", "kiwi"], JSON.parse(page.find("awc-autocomplete")["value"])
      refute_selector "[data-behavior='tag'][value='kiwi'][data-persisted]"
      # Does not close the listbox
      assert_selector "[role='listbox']"
    end

    test "removes the tag after deselecting an option" do
      visit_preview(:multiple_select)
      assert_selector "[data-behavior='tag'][value='mango'][data-persisted]"

      page.find(".awc-autocomplete-control").click
      page.find("[role='option'][value='mango']").click

      refute_selector "[data-behavior='tag'][value='mango'][data-persisted]"
      assert_equal ["apple"], JSON.parse(page.find("awc-autocomplete")["value"])
      # Does not close the listbox
      assert_selector "[role='listbox']"
    end

    test "removes the tag by dismissing it" do
      visit_preview(:multiple_select)

      within "[data-behavior='tag'][value='mango'][data-persisted]" do
        click_button "Remove"
      end

      refute_selector "[data-behavior='tag'][value='mango']"
      assert_equal ["apple"], JSON.parse(page.find("awc-autocomplete")["value"])
    end

    test "clears a selected option by pressing on the clear button" do
      visit_preview(:single_select)
      assert_equal "Banana", page.find_field("user_fruit_id").value
      page.find(".awc-autocomplete-control").click

      click_button "Clear"
      assert page.find_field("user_fruit_id").value.blank?
      assert page.find("awc-autocomplete")["value"].blank?
      assert page.find("[data-behavior='hidden-field']", visible: false)["value"].blank?
      assert page.find("[data-behavior='hidden-field']", visible: false)["data-text"].blank?
      # Closes the listbox
      refute_selector "[role='listbox']"
    end

    test "clears multiple selected options by pressing on the clear button" do
      visit_preview(:multiple_select)
      assert_selector "[data-behavior='tag']", count: 2
      page.find(".awc-autocomplete-control").click

      click_button "Clear"
      assert JSON.parse(page.find("awc-autocomplete")["value"]).blank?
      refute_selector "[data-behavior='tag']"
      # Closes the listbox
      refute_selector "[role='listbox']"
    end

    test "filters options" do
      visit_preview(:single_select)
      page.find(".awc-autocomplete-control").click

      assert_selector "[role='option']", count: 7

      fill_in "user_fruit_id", with: "kiwi"
      assert_selector "[role='option']", count: 1
    end
  end
end
