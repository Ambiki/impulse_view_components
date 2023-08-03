require "test_helper"

module Impulse
  class AutocompleteComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id)) do |c|
        %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate].each do |fruit|
          c.with_option(value: fruit.downcase, text: fruit)
        end
      end

      assert_selector "awc-autocomplete.awc-autocomplete"
      assert_selector ".awc-autocomplete--clearable"
      assert_selector "[data-behavior='hidden-field'][name='user[fruit_id]']", visible: false
      assert_selector "[role='listbox']", visible: false do
        assert_selector "[role='option']", count: 7, visible: false
      end
      refute_selector ".awc-autocomplete--selected"
      refute_selector ".awc-autocomplete-clear-btn[disabled]"
      refute_selector "input[type='text'][disabled]"
    end

    test "selected option" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, selected: OpenStruct.new(value: "apple", text: "Apple")))

      assert_selector "awc-autocomplete.awc-autocomplete--selected"
      assert_selector ".awc-autocomplete-clear-btn"
      assert_selector "awc-autocomplete[value='apple']"
      assert_selector "[data-behavior='hidden-field'][value='apple']", visible: false
      assert_selector "[data-behavior='hidden-field'][data-text='Apple']", visible: false
      assert_selector "input[type='text'][value='Apple']"
    end

    test "multiple selected options" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_ids, multiple: true, selected: [OpenStruct.new(value: "apple", text: "Apple")]))

      assert_selector "awc-autocomplete.awc-autocomplete--selected"
      assert_selector "[data-behavior='hidden-field'][name='user[fruit_ids][]']", visible: false
      assert_selector "[data-behavior='tag'][data-persisted][value='apple']", count: 1 do
        assert_selector "[data-behavior='text']", text: "Apple"
        assert_selector "[data-behavior='hidden-field'][name='user[fruit_ids][]'][value='apple']", visible: false
      end
      assert_selector "[data-behavior='tag-template']", visible: false
      assert page.find("input[type='text']")["value"].blank?
    end

    test "does not render auxillary hidden field" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_ids, multiple: true, include_hidden: false))

      refute_selector "[data-behavior='hidden-field']", visible: false
    end

    test "does not render the clear button" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_ids, multiple: true, selected: OpenStruct.new(value: "apple", text: "Apple"), clearable: false))

      refute_selector ".awc-autocomplete--clearable"
      assert_selector ".awc-autocomplete-adornment-decorator"
      assert_selector ".awc-autocomplete--selected"
    end

    test "renders small size" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, size: :sm))

      assert_selector ".awc-autocomplete.awc-autocomplete--sm"
      assert_selector ".form-control-sm"
    end

    test "renders large size" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, size: :lg))

      assert_selector ".awc-autocomplete.awc-autocomplete--lg"
      assert_selector ".form-control-lg"
    end

    test "disabled" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, disabled: true))

      assert_selector "awc-autocomplete[disabled]"
      assert_selector ".awc-autocomplete-clear-btn[disabled]"
      assert_selector "input[type='text'][disabled]"
    end

    test "disabled tags" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_ids, selected: [OpenStruct.new(value: "apple", text: "Apple")], multiple: true, disabled: true))

      assert_selector "[data-behavior='tag'][data-persisted]", count: 1 do
        assert_selector ".awc-autocomplete-tag-dismiss-btn[disabled]"
      end
    end

    test "input placeholder" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, placeholder: "Select a fruit"))

      assert_selector "input[type='text'][placeholder='Select a fruit']"
    end

    test "input id can be changed" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, input_id: "custom-id"))

      assert_selector "input[type='text'][id='custom-id']"
    end

    test "input name can be changed" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, name: "custom_name"))

      assert_selector "[data-behavior='hidden-field'][name='custom_name']", visible: false
    end
  end
end
