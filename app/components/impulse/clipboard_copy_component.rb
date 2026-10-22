module Impulse
  # A button that copies text to the clipboard: its `value`, or the text of the copy source its `for` names. It emits
  # `awc-clipboard-copy:copied` or `awc-clipboard-copy:error`, and shows no feedback of its own.
  class ClipboardCopyComponent < ApplicationComponent
    def initialize(value: nil, disabled: false, **system_args)
      @system_args = system_args
      @system_args[:tag] = :"awc-clipboard-copy"
      @system_args[:value] = value unless value.nil?
      @system_args[:disabled] = disabled
      # The element is the button, so it needs `tabindex` to be focusable, and none when disabled, as a native disabled
      # button takes no focus. It keeps it in step with `disabled` changed after rendering; this is the one it starts with.
      @system_args[:tabindex] = disabled ? nil : 0
    end

    def call
      render(Impulse::BaseRenderer.new(**@system_args)) { content }
    end
  end
end
