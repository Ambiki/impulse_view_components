require "test_helper"

module Impulse
  class SelectComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"]))

      assert_selector "awc-autocomplete"
      assert_selector "[role='option']", count: 2, visible: false
      assert_selector ".awc-autocomplete-blankslate", text: "We couldn't find that!", visible: false
    end

    test "renders multiple select component" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_ids, ["Apple", "Guava"], multiple: true))

      assert_selector "awc-autocomplete"
      assert_selector "[role='option']", count: 2, visible: false
    end

    test "renders options from a pair of choices" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "apple"]))

      assert_selector "[role='option'][value='apple']", visible: false
      assert_selector "[role='option'][data-text='Apple']", visible: false
    end

    test "renders options from a block" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_option(value: "apple", text: "Apple", data: {foo: "bar"})
      end

      assert_selector "[role='option'][value='apple']", visible: false
      assert_selector "[role='option'][data-text='Apple']", visible: false
      assert_selector "[role='option'][data-foo='bar']", visible: false
    end

    test "can select a single option" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: "Apple"))

      assert_selector "[data-behavior='hidden-field'][value='Apple']", visible: false
    end

    test "can select multiple options" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: ["Apple"], multiple: true))

      assert_selector "[data-behavior='tag'][value='Apple'][data-persisted]", count: 1
    end

    test "renders a custom blankslate" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_blankslate { "Nothing found!" }
      end

      assert_selector ".awc-autocomplete-blankslate", text: "Nothing found!", visible: false
    end
  end
end
