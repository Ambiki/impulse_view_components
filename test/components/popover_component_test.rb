require "test_helper"

module Impulse
  class PopoverComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_button { "Toggle popover" }
        c.with_header { "Activity feed" }
        c.with_body { "And here's some amazing content. It's very amazing. Right?" }
      end

      assert_selector "awc-popover"
      assert_selector "button[aria-haspopup='dialog']"
      assert_selector "button[aria-expanded='false']"
      assert_selector "button[aria-disabled='false']"
      assert_selector "button[role='button']"
      assert_selector "button[type='button']"
      # Controls panel
      id = page.find("button")["aria-controls"]
      assert_selector ".popover[id='#{id}']", visible: false
      assert_selector ".popover[tabindex='-1']", visible: false
      assert_selector ".popover[role='dialog']", visible: false
      # Arrow
      assert_selector ".arrow", visible: false
    end

    test "renders the header" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_button { "Toggle popover" }
        c.with_header { "Activity feed" }
      end

      assert_selector ".popover-header", text: "Activity feed", visible: false
    end

    test "renders the body" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_button { "Toggle popover" }
        c.with_body { "Popover body" }
      end

      assert_selector ".popover-body", text: "Popover body", visible: false
    end

    test "disabled popover" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_button(disabled: true) { "Toggle popover" }
        c.with_body { "Popover body" }
      end

      assert_selector "button[disabled]"
      assert_selector "button[aria-disabled='true']"
    end

    test "does not render without the button" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_body { "Popover body" }
      end

      refute_component_rendered
    end
  end
end
