require "test_helper"

module Autocomplete
  class GroupComponentTest < ApplicationTest
    test "renders a group of options" do
      render_inline(Impulse::Autocomplete::GroupComponent.new(title: "My group")) do |c|
        c.with_option(value: "apple", text: "Apple")
      end

      assert_selector ".awc-autocomplete-group[data-target='awc-autocomplete.groups']"
      assert_selector ".awc-autocomplete-group[role='group'][data-text='My group']" do
        assert_selector "[role='option']", text: "Apple"
      end
    end

    test "links group with title" do
      render_inline(Impulse::Autocomplete::GroupComponent.new(title: "My group")) do |c|
        c.with_option(value: "apple", text: "Apple")
      end

      id = page.find("[role='group']")["aria-labelledby"]
      assert_selector "##{id}", text: "My group"
    end

    test "title has a class" do
      render_inline(Impulse::Autocomplete::GroupComponent.new(title: "My group")) do |c|
        c.with_option(value: "apple", text: "Apple")
      end

      assert_selector ".awc-autocomplete-group-header", text: "My group"
    end

    test "custom class can be added to the group container" do
      render_inline(Impulse::Autocomplete::GroupComponent.new(title: "My group", class: "custom-class")) do |c|
        c.with_option(value: "apple", text: "Apple")
      end

      assert_selector ".awc-autocomplete-group.custom-class"
    end

    test "does not render the component if options are missing" do
      render_inline(Impulse::Autocomplete::GroupComponent.new(title: "My group", class: "custom-class"))

      refute_component_rendered
    end
  end
end
