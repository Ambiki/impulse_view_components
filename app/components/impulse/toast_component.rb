module Impulse
  # A short, non-modal message about something the user just did, or something in progress. It is rendered into the
  # page's `Impulse::ToastRegionComponent`, which shows it once it connects.
  class ToastComponent < ApplicationComponent
    VARIANTS = %i[info success warning danger].freeze
    DEFAULT_VARIANT = :info
    # The flash keys Rails apps use, and the variant each one names.
    VARIANT_ALIASES = { notice: :info, alert: :danger, error: :danger }.freeze
    # The icon each variant shows. Every toast renders all of them, so that the element can change its variant, and its
    # stylesheet shows the one that matches.
    ICONS = {
      info: "bi-info-circle-fill",
      success: "bi-check-circle-fill",
      warning: "bi-exclamation-triangle-fill",
      danger: "bi-x-circle-fill"
    }.freeze
    # A duration left to the element, which picks one from the variant.
    DEFAULT_DURATION = Object.new.freeze

    renders_one :title

    # `duration:` is in milliseconds, or a duration of time such as `8.seconds`, and `nil` keeps the toast until it is
    # dismissed. Without one, the element closes it after 5 seconds, unless it is a danger toast or holds an action.
    def initialize(variant: DEFAULT_VARIANT, duration: DEFAULT_DURATION, **system_args)
      variant = resolve_variant(variant)
      @system_args = system_args
      @system_args[:tag] = :"awc-toast"
      @system_args[:tabindex] = -1
      @system_args[:variant] = variant unless variant == DEFAULT_VARIANT
      @system_args[:duration] = resolve_duration(duration) unless duration.equal?(DEFAULT_DURATION)
      @system_args[:class] = class_names(system_args[:class], "awc-toast")
      @system_args[:data] = merge_attributes(system_args[:data], action: "keydown->awc-toast#handleKeydown")
    end

    private

    # The variant `key` names, itself or as a flash key, or info for one that names none, as other components fall back
    # to their default.
    def resolve_variant(key)
      variant = key.to_sym if key.respond_to?(:to_sym)
      fetch_or_fallback(VARIANTS, VARIANT_ALIASES.fetch(variant, variant), DEFAULT_VARIANT)
    end

    # The element's `duration` for the one given: `nil` keeps the toast until it is dismissed, as `Infinity` does there,
    # and a duration of time, such as `8.seconds`, is its milliseconds rather than the seconds it prints as.
    def resolve_duration(duration)
      return Float::INFINITY if duration.nil?
      return duration.in_milliseconds.round if duration.is_a?(ActiveSupport::Duration)

      duration
    end
  end
end
