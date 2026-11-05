require "test_helper"

module Impulse
  module ViewComponents
    class EngineTest < ActiveSupport::TestCase
      test "doesn't add assets to the host app's precompile list" do
        precompile = Rails.application.config.assets.precompile

        assert_not_includes precompile, "impulse_view_components.js"
        assert_not_includes precompile, "impulse_view_components.css"
      end
    end
  end
end
