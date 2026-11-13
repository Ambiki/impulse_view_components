require "test_helper"

module Impulse
  class DialogComponentTest < ApplicationTest
    test "renders the title and the close button without a header slot" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile"))

      assert_selector "awc-dialog.awc-dialog"
      assert_selector ".awc-dialog-header .awc-dialog-title-container h2.awc-dialog-title", text: "Edit your profile"
      refute_selector "h2.sr-only"
      assert_selector ".awc-dialog-header button.awc-dialog-close-btn[aria-label='Close dialog']"

      title_id = page.find("h2")["id"]
      assert_selector "dialog[aria-labelledby='#{title_id}']"
    end

    test "passes the header's arguments to the header" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header(class: "custom-header", data: { foo: "bar" })
      end

      assert_selector ".awc-dialog-header.custom-header[data-foo='bar']"
      assert_selector ".awc-dialog-header h2", text: "Edit your profile"
    end

    test "renders the header's block between the title and the close button" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header { "<span class='badge'>Draft</span>".html_safe }
      end

      assert_selector ".awc-dialog-header > .awc-dialog-title-container + .badge + .awc-dialog-close-btn"
      assert_selector ".awc-dialog-header > .badge", text: "Draft"
    end

    test "hides the title visually and still labels the dialog by it" do
      render_inline(Impulse::DialogComponent.new(title: "Command palette", id: "palette")) do |c|
        c.with_header(visually_hide_title: true)
      end

      assert_selector "h2#palette_title.awc-dialog-title.sr-only", text: "Command palette", count: 1
      assert_selector "dialog[aria-labelledby='palette_title']"
    end

    test "renders no title container when the title is hidden" do
      render_inline(Impulse::DialogComponent.new(title: "Command palette")) do |c|
        c.with_header(visually_hide_title: true) { "<input type='search'>".html_safe }
      end

      refute_selector ".awc-dialog-title-container"
      assert_selector ".awc-dialog-header > h2.sr-only + input[type='search']"
    end

    test "leaves out the close button" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header(hide_close_button: true)
      end

      assert_selector ".awc-dialog-header"
      refute_selector ".awc-dialog-close-btn"
      refute_selector "button"
    end

    test "keeps the title when the close button is hidden" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header(hide_close_button: true)
      end

      assert_selector ".awc-dialog-title-container h2.awc-dialog-title", text: "Edit your profile"
      refute_selector "h2.sr-only"
    end

    test "keeps the close button when the title is hidden" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header(visually_hide_title: true)
      end

      assert_selector ".awc-dialog-header > h2.sr-only + .awc-dialog-close-btn"
    end

    test "renders the header when only its block shows" do
      render_inline(Impulse::DialogComponent.new(title: "Command palette")) do |c|
        c.with_header(visually_hide_title: true, hide_close_button: true) { "<input type='search'>".html_safe }
      end

      assert_selector ".awc-dialog-header > h2.sr-only + input[type='search']:last-child"
    end

    test "renders no header when nothing in it shows" do
      render_inline(Impulse::DialogComponent.new(title: "Event details")) do |c|
        c.with_header(visually_hide_title: true, hide_close_button: true, class: "custom-header")
      end

      refute_selector ".awc-dialog-header"
      refute_selector ".custom-header"
    end

    test "labels the dialog by the hidden title when there is no header" do
      render_inline(Impulse::DialogComponent.new(title: "Event details", id: "event")) do |c|
        c.with_header(visually_hide_title: true, hide_close_button: true)
        c.with_body { "Dialog body" }
      end

      assert_selector "dialog[aria-labelledby='event_title'] > h2#event_title.sr-only + .awc-dialog-body", text: "Dialog body"
      assert_selector "h2", text: "Event details", count: 1
    end

    test "renders the header before content of its own" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do
        "<form></form>".html_safe
      end

      assert_selector "dialog > .awc-dialog-header + form"

      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header(visually_hide_title: true, hide_close_button: true)
        "<form></form>".html_safe
      end

      assert_selector "dialog > h2.sr-only + form"
    end

    test "renders the body" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_body { "Dialog body" }
      end

      assert_selector ".awc-dialog-body", text: "Dialog body"
    end

    test "renders the footer" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_footer { "Dialog footer" }
      end

      assert_selector ".awc-dialog-footer", text: "Dialog footer"
    end

    test "dialog id can be changed" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", id: "dialog"))

      assert_selector "awc-dialog[id='dialog']"
    end

    test "renders sm dialog" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", size: :sm))

      assert_selector ".awc-dialog.awc-dialog--sm"
      refute_selector ".awc-dialog--lg"
    end

    test "renders lg dialog" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", size: :lg))

      assert_selector ".awc-dialog.awc-dialog--lg"
      refute_selector ".awc-dialog--sm"
    end

    test "centers dialog by default" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile"))

      assert_selector "dialog.awc-dialog-dialog--centered"
    end

    test "does not center the dialog" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", center: false))

      refute_selector "dialog.awc-dialog-dialog--centered"
    end

    test "fullscreen size" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", fullscreen: :sm_down))

      assert_selector ".awc-dialog.awc-dialog--fullscreen-sm-down"
    end
  end
end
