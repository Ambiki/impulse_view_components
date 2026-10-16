require "test_helper"

module Impulse
  class AnchorComponentTest < ApplicationTest
    test "renders the component" do
      render_inline(Impulse::AnchorComponent.new(anchor_id: "awc-button")) do
        "Anchor contents"
      end

      assert_selector "awc-anchor[anchor-id='awc-button']"
      assert_selector "awc-anchor", text: "Anchor contents"
    end

    test "renders auto size options as attributes" do
      render_inline(Impulse::AnchorComponent.new(anchor_id: "awc-button", auto_size: "height", auto_size_padding: 8))

      assert_selector "awc-anchor[auto-size='height'][auto-size-padding='8']"
    end

    test "serializes fallback placements to json" do
      render_inline(Impulse::AnchorComponent.new(anchor_id: "awc-button", fallback_placements: ["top"]))

      assert JSON.parse(page.find("awc-anchor")["fallback-placements"]).is_a?(Array)
      assert "top", JSON.parse(page.find("awc-anchor")["fallback-placements"])[0]
    end
  end
end
