require "test_helper"

module Impulse
  class DialogComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_trigger(data: {test_id: "button"}) { "Open dialog" }
      end

      button_id = page.find("[data-test-id='button']")["id"]

      assert_selector "awc-dialog.awc-dialog"
      assert_equal button_id, page.find("awc-dialog")["trigger-id"]

      assert_selector "[data-test-id='button'][type='button']", text: "Open dialog"
      assert_selector "[data-test-id='button'][aria-haspopup='dialog']"
      assert_selector "[data-test-id='button'][aria-expanded='false']"
      assert_equal page.find("dialog")["id"], page.find("[data-test-id='button']")["aria-controls"]
      assert_equal button_id, page.find("dialog")["aria-labelledby"]
      assert_selector "h2", text: "Edit your profile"
    end

    test "renders the header" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_header { "Dialog header" }
      end

      assert_selector ".awc-dialog-header", text: "Dialog header"
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
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", id: "dialog")) do |c|
        c.with_trigger { "Open dialog" }
      end

      assert_selector "awc-dialog[id='dialog']"
      assert_selector "button[id='dialog_trigger']"
      assert_selector "dialog[id='dialog_dialog']"
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

    test "fullscreen size" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile", fullscreen: :sm_down))

      assert_selector ".awc-dialog.awc-dialog--fullscreen-sm-down"
    end
  end
end
