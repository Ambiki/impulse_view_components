require "test_helper"

module Impulse
  module Popover
    class BodyComponentTest < ApplicationTest
      test "renders on its own" do
        render_inline(Impulse::Popover::BodyComponent.new(class: "feed-body")) { "Loaded feed" }

        assert_selector "div.popover-body.feed-body", text: "Loaded feed"
      end
    end
  end
end
