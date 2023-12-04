require "test_helper"

module Autocomplete
  class OptionComponentTest < ApplicationTest
    test "renders an option" do
      render_inline(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava"))

      assert_selector "[role='option'][value='guava'][data-text='Guava']", text: "Guava"
      assert_selector ".awc-autocomplete-option.dropdown-item"
      assert_selector "[aria-disabled='false']"
      assert_equal "-1", page.find("[role='option']")["tabindex"]
      assert_selector "[aria-selected='false']"
      refute_selector "[disabled]"
      # Links to text
      id = page.find("[role='option']")["aria-labelledby"]
      assert_selector "##{id}", text: "Guava"
      # Does not render the description element
      refute_selector ".awc-autocomplete-option-description"
    end

    test "renders a description" do
      render_inline(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava", description: "My favorite fruit."))

      assert_selector "span.awc-autocomplete-option-description", text: "My favorite fruit."
    end

    test "disabled option" do
      render_inline(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava", disabled: true))

      assert_selector ".disabled[disabled][aria-disabled='true']"
    end

    test "id can be changed" do
      render_inline(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava", id: "custom-id"))
      assert_selector "[role='option'][id='custom-id']"
    end

    test "custom class can be added" do
      render_inline(Impulse::Autocomplete::OptionComponent.new(value: "guava", text: "Guava", class: "custom-class"))
      assert_selector ".awc-autocomplete-option.custom-class"
    end
  end
end
