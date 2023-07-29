require "system/test_helper"

module Impulse
  class AjaxSelectSystemTest < ApplicationSystemTest
    test "makes a network request and activates the selected option" do
      visit_preview(:single_select)

      page.find(".awc-autocomplete-control").click
      assert_selector "[role='option'][value='arnold_winnie'][data-active]"
      assert_selector "[role='option'][value='arnold_winnie'][aria-selected='true']"
    end

    test "shows a blankslate" do
      visit_preview(:single_select)

      fill_in "user_fruit_id", with: "query-query"
      refute_selector "[role='option']"
      assert_selector ".awc-autocomplete-blankslate", text: "We couldn't find that!"
    end
  end
end
