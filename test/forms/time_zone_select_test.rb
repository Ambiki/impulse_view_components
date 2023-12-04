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
  end
end
