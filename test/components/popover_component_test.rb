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
      assert_selector "[data-test-id='btn'][aria-expanded='false']"
      assert_selector "[data-test-id='btn'][aria-haspopup='dialog']"
      assert_selector "[data-test-id='btn'][type='button']"
      refute_selector "[data-test-id='btn'][role]"

      assert_selector ".popover-body", text: "Popover body"

      id = page.find("[data-test-id='btn']")["aria-controls"]

      assert_selector "div.awc-popover-container[id='#{id}'][role='dialog'][popover='manual'][tabindex='-1']"
      # Arrow
      assert_selector ".arrow"
    end

    test "labels the popover with its trigger when it has no title" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_body { "Popover body" }
      end

      trigger_id = page.find("[data-test-id='btn']")["id"]

      assert trigger_id.present?
      assert_selector ".awc-popover-container[aria-labelledby='#{trigger_id}']"
    end

    test "keeps the trigger's own id to label the popover" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(id: "feed-trigger") { "Toggle popover" }
      end

      assert_selector "button#feed-trigger"
      assert_selector ".awc-popover-container[aria-labelledby='feed-trigger']"
    end

    test "renders the title and the close button" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_body { "Popover body" }
      end

      assert_selector ".popover-header", text: "Activity feed"
      assert_selector "button.close[aria-label='Close']"
      # Opening moves focus to it as the first element in the tab order. With `autofocus`, it would take focus from the
      # page's own `autofocus` field after a Turbo visit while the popover is closed.
      refute_selector "button.close[autofocus]"

      title_id = page.find(".popover-header [id]", text: "Activity feed")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{title_id}']"
    end

    test "renders a custom header" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_header { "Delete feed?" }
      end

      assert_selector ".popover-header", text: "Delete feed?"
      refute_selector "button.close"
      refute_text "Activity feed"

      trigger_id = page.find("[data-test-id='btn']")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{trigger_id}']"
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
