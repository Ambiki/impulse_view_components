require "test_helper"

module Impulse
  class ToastComponentTest < ApplicationTest
    test "renders its content as the message, with a close button the user can reach" do
      render_inline(Impulse::ToastComponent.new) { "Copied to clipboard" }

      assert_selector "awc-toast[tabindex='-1'] .awc-toast-message", text: "Copied to clipboard"
      assert_selector "awc-toast button.awc-toast-close-btn[type='button'][aria-label='Close notification']"
      assert_selector "awc-toast button[data-action='click->awc-toast#requestHide']"
      assert_selector "awc-toast[data-action='keydown->awc-toast#handleKeydown']"
      # Info is the element's default, so it isn't restated (ADR 0006).
      refute_selector "awc-toast[variant]"
    end

    test "renders the variant it is given" do
      render_inline(Impulse::ToastComponent.new(variant: :danger)) { "Couldn't save" }

      assert_selector "awc-toast[variant='danger']"
    end

    test "takes the flash keys Rails apps use as their variants" do
      { :notice => nil, "alert" => "danger", :error => "danger", :success => "success", :warning => "warning" }.each do |key, variant|
        render_inline(Impulse::ToastComponent.new(variant: key)) { "Message" }

        if variant
          assert_selector "awc-toast[variant='#{variant}']"
        else
          refute_selector "awc-toast[variant]"
        end
      end
    end

    test "raises on a variant it doesn't know" do
      error = assert_raises(ArgumentError) { Impulse::ToastComponent.new(variant: :permission) }

      assert_match "permission", error.message
    end

    test "leaves the duration to the element unless given one" do
      render_inline(Impulse::ToastComponent.new) { "Message" }
      refute_selector "awc-toast[duration]"

      render_inline(Impulse::ToastComponent.new(duration: 2000)) { "Message" }
      assert_selector "awc-toast[duration='2000']"
    end

    test "stays until dismissed when its duration is nil" do
      render_inline(Impulse::ToastComponent.new(variant: :success, duration: nil)) { "Message" }
      assert_selector "awc-toast[duration='Infinity']"

      render_inline(Impulse::ToastComponent.new(duration: Float::INFINITY)) { "Message" }
      assert_selector "awc-toast[duration='Infinity']"
    end

    test "renders a title above the message when given one" do
      render_inline(Impulse::ToastComponent.new) do |toast|
        toast.with_title { "You're offline" }
        "We kept a copy of your work."
      end

      assert_selector ".awc-toast-body .awc-toast-title + .awc-toast-message", text: "We kept a copy of your work."
      assert_selector ".awc-toast-title", text: "You're offline"
    end

    test "renders no title without one" do
      render_inline(Impulse::ToastComponent.new) { "Message" }

      refute_selector ".awc-toast-title"
    end

    test "passes other arguments on to the element, keeping its own actions" do
      render_inline(Impulse::ToastComponent.new(id: "clipboard-toast", class: "my-toast", data: { action: "click->app#track" })) { "Copied" }

      assert_selector "awc-toast#clipboard-toast.awc-toast.my-toast"
      assert_selector "awc-toast[data-action='click->app#track keydown->awc-toast#handleKeydown']"
    end

    test "renders an icon for every variant, which its stylesheet picks from, hidden from screen readers" do
      render_inline(Impulse::ToastComponent.new) { "Message" }

      assert_selector ".awc-toast-icon[aria-hidden='true'] i", count: 4
      %w[info success warning danger].each { |variant| assert_selector ".awc-toast-icon-#{variant}" }
    end
  end
end
