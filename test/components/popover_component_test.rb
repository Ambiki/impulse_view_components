require "test_helper"

module Impulse
  class PopoverComponentTest < ApplicationTest
    test "requires a title" do
      assert_raises(ArgumentError) { Impulse::PopoverComponent.new }
    end

    test "renders the title and the close button without a header slot" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger { "Open feed" }
      end

      assert_selector ".popover-header h2.awc-popover-title", text: "Activity feed"
      refute_selector "h2.sr-only"
      assert_selector ".popover-header > h2 + button.btn.btn-light.awc-popover-close-btn[type='button'][aria-label='Close']"
      assert_selector ".awc-popover-close-btn i.bi.bi-x[aria-hidden='true']"
      # Opening moves focus to it as the first element in the tab order. With `autofocus`, it would take focus from the
      # page's own `autofocus` field after a Turbo visit while the popover is closed.
      refute_selector "button.awc-popover-close-btn[autofocus]"

      title_id = page.find("h2")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{title_id}']"
    end

    test "passes the header's arguments to the header" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger { "Open feed" }
        c.with_header(class: "custom-header", data: { foo: "bar" })
      end

      assert_selector ".popover-header.custom-header[data-foo='bar']"
      assert_selector ".popover-header h2", text: "Activity feed"
    end

    test "renders the header's block between the title and the close button" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger { "Open feed" }
        c.with_header { "<button type='button' class='mark-read'>Mark all as read</button>".html_safe }
      end

      assert_selector ".popover-header > h2 + .mark-read + .awc-popover-close-btn"
    end

    test "hides the title visually and still labels the popover by it" do
      render_inline(Impulse::PopoverComponent.new(title: "Choose a date")) do |c|
        c.with_trigger { "Open calendar" }
        c.with_header(visually_hide_title: true)
      end

      title_id = page.find("h2.awc-popover-title.sr-only", text: "Choose a date")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{title_id}']"
      assert_selector "h2", count: 1
    end

    test "leaves out the close button" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger { "Open feed" }
        c.with_header(hide_close_button: true)
      end

      refute_selector ".awc-popover-close-btn"
      assert_selector ".popover-header h2.awc-popover-title", text: "Activity feed"
      refute_selector "h2.sr-only"
    end

    test "keeps the close button when the title is hidden" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger { "Open feed" }
        c.with_header(visually_hide_title: true)
      end

      assert_selector ".popover-header > h2.sr-only + .awc-popover-close-btn"
    end

    test "renders the header when only its block shows" do
      render_inline(Impulse::PopoverComponent.new(title: "Search")) do |c|
        c.with_trigger { "Search" }
        c.with_header(visually_hide_title: true, hide_close_button: true) { "<input type='search'>".html_safe }
      end

      assert_selector ".popover-header > h2.sr-only + input[type='search']:last-child"
    end

    test "renders no header when nothing in it shows" do
      render_inline(Impulse::PopoverComponent.new(title: "Choose a date")) do |c|
        c.with_trigger { "Open calendar" }
        c.with_header(visually_hide_title: true, hide_close_button: true, class: "custom-header")
      end

      refute_selector ".popover-header"
      refute_selector ".custom-header"

      render_inline(Impulse::PopoverComponent.new(title: "Choose a date")) do |c|
        c.with_trigger { "Open calendar" }
        c.with_header(visually_hide_title: true, hide_close_button: true) { " \n " }
      end

      refute_selector ".popover-header"
    end

    test "labels the popover by the hidden title when there is no header" do
      render_inline(Impulse::PopoverComponent.new(title: "Choose a date")) do |c|
        c.with_trigger { "Open calendar" }
        c.with_header(visually_hide_title: true, hide_close_button: true)
        c.with_body { "Calendar" }
      end

      title_id = page.find("h2.sr-only", text: "Choose a date")["id"]
      assert_selector ".awc-popover-container[aria-labelledby='#{title_id}'] > .arrow + h2.sr-only + .popover-body", text: "Calendar"
    end

    test "renders the body" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger { "Open feed" }
        c.with_body(class: "feed-body") { "Popover body" }
      end

      assert_selector ".popover-header + div.popover-body.feed-body", text: "Popover body"
    end

    test "renders its own content instead of the body, after the header" do
      render_inline(Impulse::PopoverComponent.new(title: "Rename")) do |c|
        c.with_trigger { "Rename" }
        c.with_body { "Popover body" }
        "<form></form>".html_safe
      end

      assert_selector ".awc-popover-container > .popover-header + form"
      refute_selector ".popover-body"
    end

    test "renders the trigger, which controls the panel" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger(data: { test_id: "btn" }) { "Open feed" }
      end

      assert_selector "awc-popover.awc-popover"
      assert_selector "button[data-test-id='btn'][type='button'][aria-haspopup='dialog'][aria-expanded='false']", text: "Open feed"
      refute_selector "[data-test-id='btn'][role]"

      panel_id = page.find("[data-test-id='btn']")["aria-controls"]
      assert_selector "div.awc-popover-container.bs-popover-auto[id='#{panel_id}'][role='dialog'][popover='manual'][tabindex='-1'][data-target='awc-popover.panel']"
      assert_selector ".awc-popover-container > .arrow[data-target='awc-popover.arrow']"
    end

    test "passes its arguments to the popover, not the panel" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed", class: "feed-popover", style: "--awc-popover-max-width: 30rem")) do |c|
        c.with_trigger { "Open feed" }
      end

      assert_selector "awc-popover.awc-popover.feed-popover[style='--awc-popover-max-width: 30rem']"
      refute_selector "awc-popover[title]"
      refute_selector ".awc-popover-container.feed-popover"
    end

    test "disabled popover" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_trigger(disabled: true) { "Open feed" }
      end

      assert_selector "button[disabled][aria-disabled='true']"
    end

    test "does not render without the trigger" do
      render_inline(Impulse::PopoverComponent.new(title: "Activity feed")) do |c|
        c.with_body { "Popover body" }
      end

      refute_component_rendered
    end
  end
end
