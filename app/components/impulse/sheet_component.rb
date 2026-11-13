module Impulse
  # A modal dialog pinned to the right edge of the viewport and filling its height. It renders `<awc-dialog>`, so it
  # behaves as a dialog does; only its layout differs (ADR 0019).
  class SheetComponent < Internal::ModalDialogComponent
    private

    def layout_class
      "awc-sheet"
    end
  end
end
