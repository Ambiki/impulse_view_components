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

    # Whether `key` names a variant, either itself or as a flash key.
    def self.variant?(key)
      return false unless key.respond_to?(:to_sym)

      VARIANTS.include?(key.to_sym) || VARIANT_ALIASES.key?(key.to_sym)
    end

    # `duration:` is in milliseconds, and `nil` keeps the toast until it is dismissed. Without one, the element closes it
    # after 5 seconds, unless it is a danger toast or holds an action.
    def initialize(variant: DEFAULT_VARIANT, duration: DEFAULT_DURATION, **system_args)
      variant = resolve_variant(variant)
      @system_args = system_args
      @system_args[:tag] = :"awc-toast"
      @system_args[:tabindex] = -1
      @system_args[:variant] = variant unless variant == DEFAULT_VARIANT
      @system_args[:duration] = duration.nil? ? Float::INFINITY : duration unless duration.equal?(DEFAULT_DURATION)
      @system_args[:class] = class_names(system_args[:class], "awc-toast")
      @system_args[:data] = merge_attributes(system_args[:data], action: "keydown->awc-toast#handleKeydown")
    end

    private

    # The variant `key` names. Raises on a key that names none, such as a flash key that holds something other than a
    # message.
    def resolve_variant(key)
      raise ArgumentError, "unknown toast variant: #{key.inspect}. Use one of #{(VARIANTS + VARIANT_ALIASES.keys).join(", ")}" unless self.class.variant?(key)

      VARIANT_ALIASES.fetch(key.to_sym, key.to_sym)
    end
  end
end
