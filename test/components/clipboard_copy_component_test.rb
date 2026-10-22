require "test_helper"

module Impulse
  class ClipboardCopyComponentTest < ApplicationTest
    test "renders the element in the tab order, with its content" do
      render_inline(Impulse::ClipboardCopyComponent.new(value: "Hello")) { "Copy" }

      assert_selector "awc-clipboard-copy[value='Hello'][tabindex='0']", text: "Copy"
      refute_selector "awc-clipboard-copy[disabled]"
      # The element gives itself its role, so that a morph can't strip it.
      refute_selector "awc-clipboard-copy[role]"
    end

    test "renders an empty value, which the element copies instead of its copy source" do
      render_inline(Impulse::ClipboardCopyComponent.new(value: "", for: "source")) { "Copy" }

      assert_selector "awc-clipboard-copy[value=''][for='source']"
    end

    test "names its copy source without a value" do
      render_inline(Impulse::ClipboardCopyComponent.new(for: "source")) { "Copy" }

      assert_selector "awc-clipboard-copy[for='source']"
      refute_selector "awc-clipboard-copy[value]"
    end

    test "takes no focus when disabled, as a native disabled button doesn't" do
      render_inline(Impulse::ClipboardCopyComponent.new(value: "Hello", disabled: true)) { "Copy" }

      assert_selector "awc-clipboard-copy[disabled]"
      refute_selector "awc-clipboard-copy[tabindex]"
    end

    test "passes other arguments on to the element, adding no classes of its own" do
      render_inline(Impulse::ClipboardCopyComponent.new(value: "Hello", class: "btn btn-sm", aria: { label: "Copy link" })) do
        "Copy"
      end

      assert_selector "awc-clipboard-copy[class='btn btn-sm'][aria-label='Copy link']"
    end
  end
end
