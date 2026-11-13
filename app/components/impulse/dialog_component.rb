module Impulse
  class DialogComponent < Internal::ModalDialogComponent
    DEFAULT_SIZE = :md
    SIZE_MAPPINGS = {
      :sm => "awc-dialog--sm",
      DEFAULT_SIZE => "",
      :lg => "awc-dialog--lg"
    }.freeze

    def initialize(title:, id: self.class.generate_id, size: DEFAULT_SIZE, center: true, fullscreen: DEFAULT_FULLSCREEN, **system_args)
      super(title:, id:, fullscreen:, **system_args)
      @size = fetch_or_fallback(SIZE_MAPPINGS.keys, size, DEFAULT_SIZE)
      @center = center
    end

    private

    def layout_class
      SIZE_MAPPINGS[@size]
    end

    def dialog_class
      "awc-dialog-dialog--centered" if @center
    end
  end
end
