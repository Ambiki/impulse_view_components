require "test_helper"

module Impulse
  class SheetComponentTest < ApplicationTest
    test "renders a dialog element laid out as a sheet" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts"))

      assert_selector "awc-dialog.awc-dialog.awc-sheet[id^='sheet-component-'] > dialog.awc-dialog-dialog"
      refute_selector "dialog.awc-dialog-dialog--centered"
    end

    test "labels the sheet by its title" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts", id: "alerts"))

      assert_selector "awc-dialog#alerts"
      assert_selector "dialog[aria-labelledby='alerts_title'] .awc-dialog-header h2#alerts_title", text: "Alerts"
      assert_selector ".awc-dialog-header button.awc-dialog-close-btn[aria-label='Close dialog']"
    end

    test "passes the header's arguments to the header" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts")) do |c|
        c.with_header(visually_hide_title: true, hide_close_button: true) { "<input type='search'>".html_safe }
      end

      assert_selector ".awc-dialog-header > h2.sr-only + input[type='search']:last-child"
    end

    test "renders the body and the footer" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts")) do |c|
        c.with_body { "Sheet body" }
        c.with_footer { "Sheet footer" }
      end

      assert_selector "dialog > .awc-dialog-header + .awc-dialog-body + .awc-dialog-footer"
      assert_selector ".awc-dialog-body", text: "Sheet body"
      assert_selector ".awc-dialog-footer", text: "Sheet footer"
    end

    test "renders the header before content of its own" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts")) do
        "<form></form>".html_safe
      end

      assert_selector "dialog > .awc-dialog-header + form"
    end

    test "renders full screen below a breakpoint" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts", fullscreen: :sm_down))

      assert_selector ".awc-sheet.awc-dialog--fullscreen-sm-down"
    end

    test "passes other arguments to the element" do
      render_inline(Impulse::SheetComponent.new(title: "Alerts", class: "custom-sheet", hide_on_outside_click: false))

      assert_selector "awc-dialog.custom-sheet.awc-sheet.awc-dialog[hide-on-outside-click='false']"
    end
  end
end
