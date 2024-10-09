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
            c.with_option(value: "apple", text: "Apple", data: {foo: "bar"})
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
  end
end
