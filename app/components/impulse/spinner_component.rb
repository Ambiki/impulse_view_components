module Impulse
  class SpinnerComponent < ApplicationComponent
    DEFAULT_VARIANT = :secondary
    VARIANT_MAPPINGS = {
      :primary => "text-primary",
      DEFAULT_VARIANT => "text-secondary",
      :success => "text-success",
      :danger => "text-danger",
      :warning => "text-warning",
      :info => "text-info",
      :light => "text-light",
      :dark => "text-dark"
    }.freeze

    def initialize(variant: DEFAULT_VARIANT, label: "Loading", **system_args)
      @system_args = system_args
      @system_args[:tag] ||= :div
      @system_args[:role] ||= :status
      @system_args[:"aria-label"] = label
      @system_args[:class] = class_names(
        system_args[:class],
        "spinner-border",
        VARIANT_MAPPINGS[fetch_or_fallback(VARIANT_MAPPINGS.keys, variant, DEFAULT_VARIANT)]
      )
    end

    def call
      render(Impulse::BaseRenderer.new(**@system_args))
    end
  end
end
