module Impulse
  # The one place on a page where toasts appear, rendered once by the layout. It shows the toasts rendered into it, and
  # those `showToast()` adds. While a modal dialog is open, it moves into the dialog, so that its toasts stay usable
  # (ADR 0022).
  class ToastRegionComponent < ApplicationComponent
    DEFAULT_ID = "awc-toast-region"
    PLACEMENTS = %i[top_start top_center top_end bottom_start bottom_center bottom_end].freeze
    DEFAULT_PLACEMENT = :top_center
    # The element's own default, which names the landmark here too.
    DEFAULT_HOTKEY = "F8"

    renders_many :toasts, Impulse::ToastComponent

    # `flash:` renders a toast for each message under a key that names a variant (`notice`, `alert`, `error`, or a
    # variant itself), and skips the other keys, which a flash holds for other uses, and messages that aren't text.
    # `hotkey: nil` turns the hotkey off.
    def initialize(flash: {}, placement: DEFAULT_PLACEMENT, hotkey: DEFAULT_HOTKEY, id: DEFAULT_ID, **system_args)
      @flash = flash
      @hotkey = hotkey.to_s
      @system_args = system_args
      @system_args[:tag] = :"awc-toast-region"
      @system_args[:id] = id
      @system_args[:popover] = "manual"
      @system_args[:role] = "region"
      @system_args[:hotkey] = @hotkey unless @hotkey == DEFAULT_HOTKEY
      placement = fetch_or_fallback(PLACEMENTS, placement.to_s.tr("-", "_"), DEFAULT_PLACEMENT)
      @system_args[:placement] = placement.to_s.dasherize unless placement == DEFAULT_PLACEMENT
      @system_args[:class] = class_names(system_args[:class], "awc-toast-region")
    end

    def before_render
      @system_args[:"aria-label"] = @hotkey.empty? ? t("impulse.toast.region_without_hotkey") : t("impulse.toast.region", hotkey: @hotkey)
    end

    private

    def flash_messages
      @flash.to_h.flat_map do |key, messages|
        next [] unless Impulse::ToastComponent.variant?(key)

        messages = [messages] unless messages.is_a?(Array)
        messages.select { |message| message.is_a?(String) && message.present? }.map { |message| [key, message] }
      end
    end
  end
end
