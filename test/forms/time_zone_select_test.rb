require "test_helper"

module Impulse
  class TimeZoneSelectTest < ApplicationTest
    test "renders the component" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.time_zone_select :time_zone
        end
      end

      assert_selector "awc-autocomplete"
      assert_selector "[role='option']", count: ActiveSupport::TimeZone.all.size, visible: false
    end

    test "selected option" do
      model = Class.new do
        include ActiveModel::Model

        def self.model_name
          ActiveModel::Name.new(self.class, nil, "User")
        end

        def time_zone
          "Hawaii"
        end
      end

      render_in_view_context do
        impulse_form_with(model: model.new, url: "/users") do |f|
          f.time_zone_select :time_zone
        end
      end

      assert_selector "[data-behavior='hidden-field'][value='Hawaii']", visible: false
    end

    test "default selected option" do
      model = Class.new do
        include ActiveModel::Model

        def self.model_name
          ActiveModel::Name.new(self.class, nil, "User")
        end

        def time_zone
          nil
        end
      end

      render_in_view_context do
        impulse_form_with(model: model.new, url: "/users") do |f|
          f.time_zone_select :time_zone, nil, default: "Hawaii"
        end
      end

      assert_selector "[data-behavior='hidden-field'][value='Hawaii']", visible: false
    end

    test "selected option is preferred over the default option" do
      model = Class.new do
        include ActiveModel::Model

        def self.model_name
          ActiveModel::Name.new(self.class, nil, "User")
        end

        def time_zone
          "Alaska"
        end
      end

      render_in_view_context do
        impulse_form_with(model: model.new, url: "/users") do |f|
          f.time_zone_select :time_zone, nil, default: "Hawaii"
        end
      end

      assert_selector "[data-behavior='hidden-field'][value='Alaska']", visible: false
    end

    test "selected option is preferred over the model attribute" do
      model = Class.new do
        include ActiveModel::Model

        def self.model_name
          ActiveModel::Name.new(self.class, nil, "User")
        end

        def time_zone
          "Alaska"
        end
      end

      render_in_view_context do
        impulse_form_with(model: model.new, url: "/users") do |f|
          f.time_zone_select :time_zone, nil, selected: "Hawaii"
        end
      end

      assert_selector "[data-behavior='hidden-field'][value='Hawaii']", visible: false
    end

    test "prioritizes time zones" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.time_zone_select :time_zone, ActiveSupport::TimeZone.us_zones
        end
      end

      assert_selector "[role='group']", text: "Prioritized time zones", visible: false
      assert_selector "[role='group']", text: "Other", visible: false
      assert_selector "[data-test-id='priority-zones']", count: ActiveSupport::TimeZone.us_zones.size, visible: false
      assert_selector "[data-test-id='unprioritized-zones']", count: (ActiveSupport::TimeZone.all - ActiveSupport::TimeZone.us_zones).size, visible: false
    end

    test "renders multiple select" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.time_zone_select :time_zone, nil, multiple: true
        end
      end

      assert_selector "awc-autocomplete[multiple]"
    end

    test "renders a blankslate" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.time_zone_select :time_zone, ActiveSupport::TimeZone.us_zones do |c|
            c.with_blankslate { "Not found" }
          end
        end
      end

      assert_selector ".awc-autocomplete-blankslate", text: "Not found", visible: false
    end

    test "prefixes input id with the namespace value" do
      render_in_view_context do
        impulse_form_with(model: User.new(fruit_id: "Apple"), url: "/users", namespace: "foo") do |f|
          f.time_zone_select :time_zone
        end
      end

      assert_selector "input[type='text'][id='foo_user_time_zone']"
    end

    test "includes the index from fields_for in the field name and id" do
      render_in_view_context do
        impulse_form_with(model: User.new, url: "/users") do |f|
          f.fields_for :items, index: 0 do |item|
            item.time_zone_select :time_zone
          end
        end
      end

      assert_selector "input[type='hidden'][name='user[items][0][time_zone]']", visible: false
      assert_selector "input[type='text'][id='user_items_0_time_zone']"
      assert_no_selector "awc-autocomplete[index]"
    end

    test "takes the index from the object when the scope ends in []" do
      render_in_view_context do
        impulse_form_with(scope: "item[]", model: Item.new(id: 42), url: "/items") do |f|
          f.time_zone_select :time_zone
        end
      end

      assert_selector "input[type='hidden'][name='item[42][time_zone]']", visible: false
      assert_selector "input[type='text'][id='item_42_time_zone']"
    end

    test "takes the index from the object when a nested scope ends in []" do
      render_in_view_context do
        impulse_form_with(scope: "project[item][]", model: Item.new(id: 42), url: "/items") do |f|
          f.time_zone_select :time_zone
        end
      end

      assert_selector "input[type='hidden'][name='project[item][42][time_zone]']", visible: false
      assert_selector "input[type='text'][id='project_item_42_time_zone']"
    end
  end
end
