require "test_helper"

module Impulse
  class TimeZoneSelectComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone))

      assert_selector "awc-autocomplete"
      assert_selector "[role='option']", count: ::ActiveSupport::TimeZone.all.size, visible: false
    end

    test "selects an option" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, selected: "Hawaii"))

      assert_selector "[data-behavior='hidden-field'][value='Hawaii']", visible: false
    end

    test "selects an option using the default option" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, selected: nil, default: "Hawaii"))

      assert_selector "[data-behavior='hidden-field'][value='Hawaii']", visible: false
    end

    test "selected option is preferred over the default option" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, selected: "Alaska", default: "Hawaii"))

      assert_selector "[data-behavior='hidden-field'][value='Alaska']", visible: false
    end

    test "does not raise an error if option cannot be found" do
      assert_nothing_raised do
        render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, selected: "Invalid"))
      end
    end

    test "prioritizes time zones" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.us_zones))

      assert_selector "[role='group']", text: "Prioritized time zones", visible: false
      assert_selector "[role='group']", text: "Other", visible: false
      assert_selector "[data-test-id='priority-zones']", count: ActiveSupport::TimeZone.us_zones.size, visible: false
      assert_selector "[data-test-id='unprioritized-zones']", count: (ActiveSupport::TimeZone.all - ActiveSupport::TimeZone.us_zones).size, visible: false
    end

    test "prioritizes time zones based on Regexp" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, /Australia/))

      assert_selector "[data-test-id='priority-zones']", count: ActiveSupport::TimeZone.all.count { |z| z.match?(/Australia/) }, visible: false
    end

    test "does not group time zones if priority_zones does not filter the time zones" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.all.sort))

      refute_selector "[role='group']", visible: false
      assert_selector "[role='option']", count: ActiveSupport::TimeZone.all.size, visible: false
    end

    test "priority zones title can be changed" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, ActiveSupport::TimeZone.us_zones, priority_zones_title: "US Zones"))

      assert_selector "[role='group']", text: "US Zones", visible: false
    end

    test "renders a blankslate" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone))

      assert_selector ".awc-autocomplete-blankslate", text: "We couldn't find that time zone!", visible: false
    end

    test "renders a custom blankslate" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone)) do |c|
        c.with_blankslate { "Not found" }
      end

      assert_selector ".awc-autocomplete-blankslate", text: "Not found", visible: false
    end

    test "renders the time zones from a given list" do
      time_zones = Class.new do
        def self.all
          [OpenStruct.new(name: "My time zone", to_s: "[12:00] My time zone")]
        end
      end

      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, model: time_zones))

      assert_selector "[role='option']", count: 1, visible: false
      assert_selector "[role='option'][value='My time zone']", text: "[12:00] My time zone", visible: false
    end

    test "adds a custom class" do
      render_inline(Impulse::TimeZoneSelectComponent.new(:user, :time_zone, nil, class: "custom-class"))

      assert_selector "awc-autocomplete.custom-class"
    end
  end
end
