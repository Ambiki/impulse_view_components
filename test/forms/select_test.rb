require "test_helper"

module Impulse
  class SelectTest < ApplicationTest
    # The multiple select's tag template, whose fields Capybara can't query.
    def tag_template
      rendered_content[%r{<template data-behavior="tag-template">.*?</template>}m].to_s
    end

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

    test "gives no hidden field an id in a namespaced form with an index" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users", namespace: "ns") do |f|
          f.fields_for :items, index: 0 do |item|
            item.select :fruit_id, ["Apple", "Mango", "Guava"]
          end
        end
      end

      assert_selector "input[type='text'][id='ns_user_items_0_fruit_id']"
      assert_selector "input[type='hidden'][name='user[items][0][fruit_id]']", visible: false
      assert_no_selector "input[type='hidden'][id]", visible: false
    end

    test "keeps a given name on every hidden field under an index" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: 0 do |item|
            item.select :fruit_id, ["Apple", "Mango", "Guava"], name: "custom"
          end
        end
      end

      assert_selector "input[type='hidden'][name='custom']", count: 1, visible: false

      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: 0 do |item|
            item.select :fruit_ids, ["Apple", "Mango", "Guava"], multiple: true, selected: ["Apple"], name: "custom"
          end
        end
      end

      assert_selector "input[type='hidden'][name='custom']", count: 2, visible: false
      assert_no_selector "input[type='hidden'][name*='fruit_ids']", visible: false
      assert_includes tag_template, 'name="custom"'
    end

    test "prefixes a given input id with the namespace" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users", namespace: "ns") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"], input_id: "my_id"
        end
      end

      assert_selector "input[type='text'][id='ns_my_id']"
    end

    test "doesn't wrap the input when the attribute has errors" do
      user = User.new
      user.errors.add(:fruit_id, "is invalid")

      render_in_view_context do
        impulse_form_with(model: user, url: "/users") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "awc-autocomplete input[type='text']"
      assert_no_selector ".field_with_errors", visible: :all
    end

    test "renders without a selected option when the object lacks the method" do
      render_in_view_context do
        fields_for(:user, Item.new(id: 42), builder: Impulse::Forms::Builder) do |f|
          f.select :color, ["Red", "Blue"]
        end
      end

      assert_selector "input[type='hidden'][name='user[color]']", visible: false
      assert_no_selector ".awc-autocomplete--selected"
    end

    test "takes the selected option from the view's instance variable when the form has no object" do
      render_in_view_context do
        @user = User.new(fruit_id: "Mango")
        impulse_form_with(scope: :user, url: "/users") do |f|
          f.text_field(:fruit_id) + f.select(:fruit_id, ["Apple", "Mango", "Guava"])
        end
      end

      assert_selector "input[type='text'][name='user[fruit_id]'][value='Mango']"
      assert_selector "input[type='hidden'][name='user[fruit_id]'][value='Mango']", visible: false
      assert_selector ".awc-autocomplete--selected"
    end

    test "renders without a selected option when the form has no object" do
      render_in_view_context do
        fields_for(:payment, nil, builder: Impulse::Forms::Builder) do |f|
          f.select :method, ["Card", "Cash"]
        end
      end

      assert_selector "input[type='hidden'][name='payment[method]']", visible: false
      assert_no_selector ".awc-autocomplete--selected"
    end

    test "takes the index from the object when the scope ends in []" do
      render_in_view_context do
        impulse_form_with(scope: "item[]", model: Item.new(id: 42), url: "/items") do |f|
          f.label(:fruit_id) + f.select(:fruit_id, ["Apple", "Mango", "Guava"])
        end
      end

      assert_selector "input[type='hidden'][name='item[42][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='item_42_fruit_id']"
      assert_selector "label[for='item_42_fruit_id']"
    end

    test "takes the index from the object in fields_for with a name ending in []" do
      render_in_view_context do
        fields_for("item[]", Item.new(id: 42), builder: Impulse::Forms::Builder) do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "input[type='hidden'][name='item[42][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='item_42_fruit_id']"
    end

    test "takes the index from the object when a nested scope ends in []" do
      render_in_view_context do
        impulse_form_with(scope: "project[item][]", model: Item.new(id: 42), url: "/items") do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "input[type='hidden'][name='project[item][42][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='project_item_42_fruit_id']"
    end

    test "leaves the index empty when a nested name ending in [] is given a nil index" do
      render_in_view_context do
        fields_for("project[item][]", Item.new(id: 42), index: nil, builder: Impulse::Forms::Builder) do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "input[type='hidden'][name='project[item][][fruit_id]']", visible: false
      assert_selector "input[type='text'][id='project_item__fruit_id']"
    end

    test "takes the index from the object in every multiple select hidden field name" do
      render_in_view_context do
        impulse_form_with(scope: "item[]", model: Item.new(id: 42), url: "/items") do |f|
          f.select :fruit_ids, ["Apple", "Mango", "Guava"], multiple: true, selected: ["Apple"]
        end
      end

      assert_selector "input[type='hidden'][name='item[42][fruit_ids][]']", count: 2, visible: false
      assert_no_selector "input[type='hidden'][name='item[fruit_ids][]']", visible: false
      assert_includes tag_template, 'name="item[42][fruit_ids][]"'
    end

    test "renders no namespace attribute on the input when ids are skipped" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users", namespace: "ns", skip_default_ids: true) do |f|
          f.select :fruit_id, ["Apple", "Mango", "Guava"]
        end
      end

      assert_selector "input[type='text'].awc-autocomplete-input"
      assert_no_selector "input[type='text'][id]"
      assert_no_selector "input[type='text'][namespace]"
    end
  end
end
