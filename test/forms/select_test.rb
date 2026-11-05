require "test_helper"

module Impulse
  class SelectTest < ApplicationTest
    test "renders the component" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "awc-autocomplete"
      assert_selector "[role='option']", count: 3, visible: false
    end

    test "renders options from a block" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.select :fruit_id do |c|
            c.with_option(value: "apple", text: "Apple", data: { foo: "bar" })
          end
        end
      end

      assert_selector "[role='option'][value='apple']", visible: false
      assert_selector "[role='option'][data-text='Apple']", visible: false
      assert_selector "[role='option'][data-foo='bar']", visible: false
    end

    test "selected option" do
      render_in_view_context do
        impulse_form_with(model: User.new(fruit_id: "Apple"), url: "/users") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "input[type='hidden'][value='Apple']", visible: false
    end

    test "selected option can be overwritten" do
      render_in_view_context do
        impulse_form_with(model: User.new(fruit_id: "Apple"), url: "/users") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"], selected: "Guava"
        end
      end

      assert_selector "input[type='hidden'][value='Guava']", visible: false
    end

    test "renders multiple select" do
      render_in_view_context do
        impulse_form_with(model: User.new(fruit_ids: ["Apple"]), url: "/users") do |f|
          f.select :fruit_ids, ["Apple", "Mango", "Guava"], multiple: true
        end
      end

      assert_selector "awc-autocomplete[multiple]"
      assert_selector "[data-behavior='tag'][data-persisted][value='Apple']", count: 1
    end

    test "prefixes input id with the namespace value" do
      render_in_view_context do
        impulse_form_with(model: User.new(fruit_id: "Apple"), url: "/users", namespace: "foo") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "input[type='text'][id='foo_user_fruit_id']"
    end

    test "includes the index from fields_for in the field name and id" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: 0 do |item|
            item.select :fruit_id, ["Apple", "Mango", "Guava"]
          end
        end
      end

      assert_selector "input[type='hidden'][name='user[items][0][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='user_items_0_fruit_id']"
      assert_no_selector "awc-autocomplete[index]"
    end

    test "includes an index given to the select in the field name and id" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"], index: 3
        end
      end

      assert_selector "input[type='hidden'][name='user[3][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='user_3_fruit_id']"
      assert_no_selector "awc-autocomplete[index]"
    end

    test "leaves the index empty in the field name and id when fields_for is given a nil index" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: nil do |item|
            item.select :fruit_id, ["Apple", "Mango", "Guava"]
          end
        end
      end

      assert_selector "input[type='hidden'][name='user[items][][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='user_items__fruit_id']"
    end

    test "includes the index from fields_for in the multiple select hidden field names" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: 0 do |item|
            item.select :fruit_ids, ["Apple", "Mango", "Guava"], multiple: true, selected: ["Apple"]
          end
        end
      end

      assert_selector "input[type='hidden'][name='user[items][0][fruit_ids][]']", count: 2, visible: false
    end
  end
end
