require "test_helper"

module Impulse
  class PopoverComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_body { "Popover body" }
      end

      assert_selector "awc-popover.awc-popover"
      refute_selector ".popover-header"

      assert_selector "[data-test-id='btn']", text: "Toggle popover"
      assert_selector "[data-test-id='btn'][aria-haspopup='dialog']"
      assert_selector "[data-test-id='btn'][aria-expanded='false']"
      assert_selector "[data-test-id='btn'][role='button']"
      assert_selector "[data-test-id='btn'][type='button']"

      assert_selector ".popover-body", text: "Popover body"

      id = page.find("[data-test-id='btn']")["aria-controls"]
      assert_selector "button[popovertarget='#{id}']"

      assert_selector ".awc-popover-container[id='#{id}']"
      assert_selector ".awc-popover-container[tabindex='-1']"
      assert_selector ".awc-popover-container[popover='manual']"
      # Arrow
      assert_selector ".arrow"
    end

    test "renders the title and the close button" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_body { "Popover body" }
      end

      assert_selector ".popover-header", text: "Activity feed"
      assert_selector "button.close[aria-label='Close']"
    end

    test "renders a custom header" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_header { "Delete feed?" }
      end

      assert_selector ".popover-header", text: "Delete feed?"
      refute_selector "button.close"
      refute_text "Activity feed"
    end

    test "disabled popover" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(disabled: true) { "Toggle popover" }
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

    test "popover body's HTML tag can be changed" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger { "Toggle popover" }
        c.with_body(tag: :article) { "Popover body" }
      end

      assert_selector "article.popover-body", text: "Popover body"
    end
  end
end
