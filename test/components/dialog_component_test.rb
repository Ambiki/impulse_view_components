require "test_helper"

module Impulse
  class DialogComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile"))

      assert_selector "awc-dialog.awc-dialog"
      assert_selector "h2", text: "Edit your profile"

      title_id = page.find("h2")["id"]
      assert_selector "dialog[aria-labelledby='#{title_id}']"
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
