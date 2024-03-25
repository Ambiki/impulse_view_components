require "test_helper"

module Impulse
  class AjaxSelectTest < ApplicationTest
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
          f.ajax_select :fruit_id, :id, :name, selected: OpenStruct.new(id: "apple", name: "Apple"), src: "/users"
        end
      end

      assert_selector "[data-behavior='hidden-field'][value='apple']", visible: false
      assert_selector "[data-behavior='hidden-field'][data-text='Apple']", visible: false
      assert_selector "input[type='text'][value='Apple']"
    end

    test "multiple selected options" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.ajax_select :fruit_ids, :id, :name, selected: [OpenStruct.new(id: "apple", name: "Apple"), OpenStruct.new(id: "guava", name: "Guava")], src: "/users", multiple: true
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
  end
end
