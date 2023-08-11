module Impulse
  class AnchorComponent < ApplicationComponent
    def initialize(anchor_id:, fallback_placements: [], **system_args)
      @system_args = system_args
      @system_args[:tag] = :"awc-anchor"
      @system_args[:"anchor-id"] = anchor_id
      @system_args[:"fallback-placements"] = fallback_placements.to_json
    end

    def call
      render(Impulse::BaseRenderer.new(**@system_args)) { content }
    end
  end
end
