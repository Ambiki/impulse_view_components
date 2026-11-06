require "test_helper"

module Impulse
  class AjaxSelectTest < ApplicationTest
    Fruit = Struct.new(:id, :name)

    test "renders the component" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.ajax_select :fruit_id, :id, :name, src: "/users"
        end
      end

      assert_selector "awc-autocomplete[src='/users']"
      assert_selector "[data-behavior='hidden-field'][name='user[fruit_id]']", visible: false
    end

    test "selected option" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.ajax_select :fruit_id, :id, :name, selected: Fruit.new(id: "apple", name: "Apple"), src: "/users"
        end
      end

      assert_selector "[data-behavior='hidden-field'][value='apple']", visible: false
      assert_selector "[data-behavior='hidden-field'][data-text='Apple']", visible: false
      assert_selector "input[type='text'][value='Apple']"
    end

    test "multiple selected options" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.ajax_select :fruit_ids, :id, :name, selected: [Fruit.new(id: "apple", name: "Apple"), Fruit.new(id: "guava", name: "Guava")], src: "/users", multiple: true
        end
      end

      assert_selector "[data-behavior='tag'][data-persisted]", count: 2
      assert_equal "apple", page.first("[data-behavior='tag']")["value"]
      assert_equal "guava", page.all("[data-behavior='tag']").last["value"]
    end

    test "custom blankslate" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.ajax_select :fruit_id, :id, :name, src: "/users" do |c|
            c.with_blankslate { "Nothing!" }
          end
        end
      end

      assert_selector ".awc-autocomplete-blankslate", text: "Nothing!", visible: false
    end

    test "custom error" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.ajax_select :fruit_id, :id, :name, src: "/users" do |c|
            c.with_error { "Alert!" }
          end
        end
      end

      assert_selector ".awc-autocomplete-error", text: "Alert!", visible: false
    end

    test "prefixes input id with the namespace value" do
      render_in_view_context do
        impulse_form_with(model: User.new(fruit_id: "Apple"), url: "/users", namespace: "foo") do |f|
          f.ajax_select :fruit_id, :id, :name, src: "/users"
        end
      end

      assert_selector "input[type='text'][id='foo_user_fruit_id']"
    end

    test "includes the index from fields_for in the field name and id" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: 0 do |item|
            item.ajax_select :fruit_id, :id, :name, src: "/users"
          end
        end
      end

      assert_selector "input[type='hidden'][name='user[items][0][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='user_items_0_fruit_id']"
      assert_no_selector "awc-autocomplete[index]"
    end

    test "takes the index from the object when the scope ends in []" do
      render_in_view_context do
        impulse_form_with(scope: "item[]", model: Item.new(id: 42), url: "/items") do |f|
          f.ajax_select :fruit_id, :id, :name, src: "/fruits"
        end
      end

      assert_selector "input[type='hidden'][name='item[42][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='item_42_fruit_id']"
    end

    test "takes the index from the object when a nested scope ends in []" do
      render_in_view_context do
        impulse_form_with(scope: "project[item][]", model: Item.new(id: 42), url: "/items") do |f|
          f.ajax_select :fruit_id, :id, :name, src: "/fruits"
        end
      end

      assert_selector "input[type='hidden'][name='project[item][42][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='project_item_42_fruit_id']"
    end
  end
end
