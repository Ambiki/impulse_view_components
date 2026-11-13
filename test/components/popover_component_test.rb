require "test_helper"

module Impulse
  class PopoverComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_body { "Popover body" }
        end
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
        c.with_panel do |panel|
          panel.with_body { "Popover body" }
        end
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

    test "labels the popover with its trigger's own id when the trigger is set after the panel" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_panel do |panel|
          panel.with_body { "Popover body" }
        end
        c.with_trigger(id: "feed-trigger") { "Toggle popover" }
      end

      panel_id = page.find("button#feed-trigger")["aria-controls"]
      assert_selector ".awc-popover-container[id='#{panel_id}'][aria-labelledby='feed-trigger']"
    end

    test "renders the title and the close button" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_header do |header|
            header.with_title { "Activity feed" }
          end
          panel.with_body { "Popover body" }
        end
      end

      assert_selector ".popover-header", text: "Activity feed"
      assert_selector "button.btn.btn-light.awc-popover-close-btn[type='button'][aria-label='Close']"
      assert_selector ".awc-popover-close-btn i.bi.bi-x[aria-hidden='true']"
      # Opening moves focus to it as the first element in the tab order. With `autofocus`, it would take focus from the
      # page's own `autofocus` field after a Turbo visit while the popover is closed.
      refute_selector "button.awc-popover-close-btn[autofocus]"

      title_id = page.find(".popover-header span[id]", text: "Activity feed")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{title_id}']"
    end

    test "renders the title, the header's content, then the close button" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_header do |header|
            header.with_title { "Activity feed" }
            "Mark all as read"
          end
        end
      end

      assert_selector ".popover-header > :first-child", text: "Activity feed"
      assert_selector ".popover-header > :last-child.awc-popover-close-btn"
      assert_match(/\AActivity feed\s+Mark all as read\z/, page.find(".popover-header").text.strip)
    end

    test "changes the title's HTML tag" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_header do |header|
            header.with_title(tag: :h2, class: "h6") { "Activity feed" }
          end
        end
      end

      title_id = page.find(".popover-header h2.h6[id]", text: "Activity feed")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{title_id}']"
    end

    test "renders a header without a title" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_header { "Delete feed?" }
        end
      end

      assert_selector ".popover-header", text: "Delete feed?"
      refute_selector "button.awc-popover-close-btn"

      trigger_id = page.find("[data-test-id='btn']")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{trigger_id}']"
    end

    test "passes the panel's arguments to the panel" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger { "Toggle popover" }
        c.with_panel(class: "my-popover", style: "max-width: 20rem", data: { test_id: "panel" }) do |panel|
          panel.with_body { "Popover body" }
        end
      end

      assert_selector ".awc-popover-container.bs-popover-auto.my-popover[style='max-width: 20rem'][data-test-id='panel']"
      assert_selector ".awc-popover-container[data-target='awc-popover.panel'][role='dialog'][popover='manual']"
      refute_selector "awc-popover.my-popover"
    end

    test "keeps the panel's id, which the trigger controls" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_panel(id: "feed") do |panel|
          panel.with_header(title_id: "feed-title") do |header|
            header.with_title { "Activity feed" }
          end
        end
      end

      panel_id = page.find("[data-test-id='btn']")["aria-controls"]
      title_id = page.find(".popover-header span", text: "Activity feed")["id"]
      assert_selector ".awc-popover-container[id='#{panel_id}'][aria-labelledby='#{title_id}']"
    end

    test "labels the popover with its trigger when the title is blank" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_header do |header|
            header.with_title { "" }
          end
        end
      end

      refute_selector ".popover-header"

      trigger_id = page.find("[data-test-id='btn']")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{trigger_id}']"
    end

    test "renders the panel's own content instead of the body" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_body { "Popover body" }
          "Panel content"
        end
      end

      assert_selector ".awc-popover-container", text: "Panel content"
      refute_selector ".popover-body"
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
        c.with_panel do |panel|
          panel.with_body { "Popover body" }
        end
      end

      refute_component_rendered
    end

    test "popover body's HTML tag can be changed" do
      render_inline(Impulse::PopoverComponent.new) do |c|
        c.with_trigger { "Toggle popover" }
        c.with_panel do |panel|
          panel.with_body(tag: :article) { "Popover body" }
        end
      end

      assert_selector "article.popover-body", text: "Popover body"
    end
  end
end
