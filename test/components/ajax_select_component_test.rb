require "test_helper"

module Impulse
  class AjaxSelectComponentTest < ApplicationTest
    test "raises an error if src attribute is missing" do
      assert_raises ArgumentError do
        render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_id, :value, :text))
      end
    end

    test "renders the component" do
      render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_id, :value, :text, src: "/users"))

      assert_selector "awc-autocomplete[src='/users']"
      assert_selector ".awc-autocomplete-blankslate", text: "We couldn't find that!", visible: false
      assert_selector ".awc-autocomplete-spinner", visible: false
    end

    test "renders multiple select component" do
      render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_ids, :value, :text, src: "/users", multiple: true))

      assert_selector "awc-autocomplete[src='/users']"
      assert_selector ".awc-autocomplete-blankslate", text: "We couldn't find that!", visible: false
      assert_selector ".awc-autocomplete-spinner", visible: false
    end

    test "select a single option" do
      render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_id, :value, :text, selected: OpenStruct.new(value: "apple", text: "Apple"), src: "/users"))

      assert_selector "[data-behavior='hidden-field'][value='apple']", visible: false
      assert_selector "[data-behavior='hidden-field'][data-text='Apple']", visible: false
    end

    test "select multiple options" do
      render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_ids, :value, :text, selected: [OpenStruct.new(value: "apple", text: "Apple")], src: "/users", multiple: true))

      assert_selector "[data-behavior='tag'][data-persisted][value='apple']", count: 1 do
        assert_selector "[data-behavior='hidden-field'][value='apple']", visible: false
      end
    end

    test "renders a custom blankslate" do
      render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_id, :value, :text, src: "/users")) do |c|
        c.with_blankslate { "Nothing found!" }
      end

      assert_selector ".awc-autocomplete-blankslate", text: "Nothing found!", visible: false
    end

    test "renders a custom error message" do
      render_inline(Impulse::AjaxSelectComponent.new(:user, :fruit_id, :value, :text, src: "/users")) do |c|
        c.with_error { "Alert!" }
      end

      assert_selector ".awc-autocomplete-error", text: "Alert!", visible: false
    end
  end
end
