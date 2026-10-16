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
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, [["Apple", "apple"], ["Banana", "banana", { disabled: true, class: "custom-class" }]]))

      assert_selector "[role='option'][value='apple']", visible: false
      assert_selector "[role='option'][data-text='Apple']", visible: false
      assert_selector ".custom-class[role='option'][value='banana'][data-text='Banana'][disabled]", visible: false
    end

    test "renders options from a hash" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, { Basic: "$20", Plus: "$40" }))

      assert_selector "[role='option'][value='$20'][data-text='Basic']", visible: false
      assert_selector "[role='option'][value='$40'][data-text='Plus']", visible: false
    end

    test "renders option with a description" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, [["Apple", "apple", { description: "An apple a day keeps the doctor away." }]]))

      assert_selector "[role='option'][value='apple']", visible: false do
        assert_selector "span", text: "An apple a day keeps the doctor away.", visible: false
      end
    end

    test "renders options from a block" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_option(value: "apple", text: "Apple", data: { foo: "bar" })
      end

      assert_selector "[role='option'][value='apple']", visible: false
      assert_selector "[role='option'][data-text='Apple']", visible: false
      assert_selector "[role='option'][data-foo='bar']", visible: false
    end

    test "renders options from a block with a description" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_option(value: "apple", text: "Apple", description: "Favorite fruit.")
      end

      assert_selector "[role='option'][value='apple']", visible: false do
        assert_selector "span", text: "Favorite fruit.", visible: false
      end
    end

    test "can select a single option" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: "Apple"))

      assert_selector "[data-behavior='hidden-field'][value='Apple']", visible: false
    end

    test "can select multiple options" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: ["Apple"], multiple: true))

      assert_selector "[data-behavior='tag'][value='Apple'][data-persisted]", count: 1
    end

    test "renders grouped options from a block" do
      render_inline(Impulse::SelectComponent.new(:user, :country_id)) do |c|
        c.with_group(title: "North America") do |group|
          group.with_option(value: "US", text: "United States", description: "Country")
        end
        c.with_option(value: "AQ", text: "Antarctica")
      end

      assert_selector "[role='group']", visible: false do
        assert_selector ".awc-autocomplete-group-header", text: "North America", visible: false
        assert_selector "[role='option'][value='US']", text: "United States", visible: false
        assert_selector "[role='option'][value='US'] span", text: "Country", visible: false
      end
      assert_selector "[role='option'][value='AQ']", text: "Antarctica", visible: false
    end

    test "selects an option from a group in a block" do
      render_inline(Impulse::SelectComponent.new(:user, :country_id, selected: "CA")) do |c|
        c.with_group(title: "North America") do |group|
          group.with_option(value: "US", text: "United States")
          group.with_option(value: "CA", text: "Canada")
        end
      end

      assert_selector "awc-autocomplete.awc-autocomplete--selected"
      assert_selector "[data-behavior='hidden-field'][value='CA'][data-text='Canada']", visible: false
      assert_selector "input.awc-autocomplete-input[value='Canada']"
    end

    test "selects multiple options from groups in a block" do
      render_inline(Impulse::SelectComponent.new(:user, :country_ids, selected: ["DK", "Invalid", "CA"], multiple: true)) do |c|
        c.with_group(title: "North America") do |group|
          group.with_option(value: "CA", text: "Canada")
        end
        c.with_group(title: "Europe") do |group|
          group.with_option(value: "DK", text: "Denmark")
        end
      end

      assert_selector "[data-behavior='tag'][data-persisted]", count: 2
      assert_selector "[data-behavior='tag'][value='DK'][data-text='Denmark']"
      assert_selector "[data-behavior='tag'][value='CA'][data-text='Canada']"
    end

    test "renders options from a collection" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, selected: "kiwi")) do |c|
        c.with_options([{ value: "apple", text: "Apple" }, { value: "kiwi", text: "Kiwi" }])
      end

      assert_selector "[role='option']", count: 2, visible: false
      assert_selector "[data-behavior='hidden-field'][value='kiwi'][data-text='Kiwi']", visible: false
    end

    test "renders a custom blankslate" do
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_blankslate { "Nothing found!" }
      end

      assert_selector ".awc-autocomplete-blankslate", text: "Nothing found!", visible: false
    end

    test "does not throw an error if selected has value that does not match the options value" do
      assert_nothing_raised do
        render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: ""))
        render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: "Invalid"))
        render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: ["", "Apple"], multiple: true))
        render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: ["Invalid", "Apple"], multiple: true))
        render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: "", multiple: true))
        render_inline(Impulse::SelectComponent.new(:user, :fruit_id, ["Apple", "Guava"], selected: nil, multiple: true))
      end
    end

    test "grouped options" do
      grouped_options = [["North America", [["United States", "US"], "Canada"]]]
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, grouped_options))

      assert_selector "[role='group']", visible: false do
        assert_selector "div", text: "North America", visible: false
        assert_selector "[value='US']", text: "United States", visible: false
        assert_selector "[value='Canada']", text: "Canada", visible: false
      end
    end

    test "selects an option from grouped options" do
      grouped_options = [
        ["North America", [["United States", "US"], "Canada"]],
        ["Europe", ["Denmark", "Germany"]]
      ]
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, grouped_options, selected: "Canada"))

      assert_selector "input[type='hidden'][value='Canada']", visible: false
      assert_selector "[data-behavior='hidden-field'][value='Canada']", visible: false
    end

    test "HTML attributes can be passed to one of the option within the group" do
      grouped_options = [["North America", [["United States", "US", { disabled: true }], "Canada"]]]
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, grouped_options))

      assert_selector "[role='option'][value='US'][disabled]", visible: false
    end

    test "renders a group of options with a description" do
      grouped_options = [["North America", [["United States", "US", { description: "Country" }]]]]
      render_inline(Impulse::SelectComponent.new(:user, :fruit_id, grouped_options))

      assert_selector "[role='option'][value='US']", visible: false do
        assert_selector "span", text: "Country", visible: false
      end
    end
  end
end
