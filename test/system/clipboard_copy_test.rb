require "system/test_helper"

module Impulse
  class ClipboardCopySystemTest < ApplicationSystemTest
    setup do
      # Reading the clipboard back needs a permission a test can't click through.
      page.driver.browser.execute_cdp(
        "Browser.grantPermissions",
        permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"]
      )
    end

    test "copies its value when clicked, and emits copied" do
      visit_preview(:default, value: "https://example.com/meetings/456")
      record_events

      clipboard_copy.click

      assert_equal [{ "type" => "awc-clipboard-copy:copied", "text" => "https://example.com/meetings/456" }], recorded_events(1)
      assert_equal "https://example.com/meetings/456", clipboard_text
    end

    test "copies when pressed with Enter or Space" do
      visit_preview(:default)
      record_events

      clipboard_copy.send_keys(:enter)
      clipboard_copy.send_keys(:space)

      assert_equal ["awc-clipboard-copy:copied"] * 2, recorded_events(2).pluck("type")
    end

    test "copies the text of its copy source" do
      visit_preview(:with_copy_source)
      record_events

      clipboard_copy.click

      assert_equal "bundle exec rails db:setup", recorded_events(1).first["text"]
      assert_equal "bundle exec rails db:setup", clipboard_text
    end

    test "is announced as a button named by its content" do
      visit_preview(:default)

      assert_equal "button", clipboard_copy.native.aria_role
      assert_equal "Copy link", clipboard_copy.native.accessible_name
      assert_equal false, accessibility_property("disabled")
    end

    test "is announced as disabled, and ignores clicks, until enabled" do
      visit_preview(:default, disabled: true)
      record_events

      clipboard_copy.click
      assert_equal true, accessibility_property("disabled")

      page.execute_script("document.querySelector('awc-clipboard-copy').disabled = false")
      clipboard_copy.click

      assert_equal false, accessibility_property("disabled")
      # Only the click made once enabled copied.
      assert_equal ["awc-clipboard-copy:copied"], recorded_events(1).pluck("type")
    end

    private

    def clipboard_copy
      find("awc-clipboard-copy[data-impulse-element]")
    end

    def record_events
      clipboard_copy
      page.execute_script(<<~JS)
        window.recordedEvents = [];
        for (const type of ['awc-clipboard-copy:copied', 'awc-clipboard-copy:error']) {
          document.addEventListener(type, (event) => {
            window.recordedEvents.push({ type, text: event.detail.text, error: event.detail.error?.name });
          });
        }
      JS
    end

    # The events recorded, once there are at least `count`: the clipboard write is asynchronous.
    def recorded_events(count)
      page.document.synchronize do
        events = page.evaluate_script("window.recordedEvents")
        raise Capybara::ExpectationNotMet, "expected #{count} events, got #{events.size}" if events.size < count

        events.map(&:compact)
      end
    end

    def clipboard_text
      page.evaluate_async_script("navigator.clipboard.readText().then(arguments[0])")
    end

    # Reads a property of the element's node in Chrome's accessibility tree, which a screen reader is given. The element
    # sets its state through `ElementInternals`, which no attribute shows.
    def accessibility_property(name)
      browser = page.driver.browser
      document = browser.execute_cdp("DOM.getDocument")
      node = browser.execute_cdp("DOM.querySelector", nodeId: document["root"]["nodeId"], selector: "awc-clipboard-copy")
      tree = browser.execute_cdp("Accessibility.getPartialAXTree", nodeId: node["nodeId"], fetchRelatives: false)
      property = tree["nodes"].first.fetch("properties", []).find { |prop| prop["name"] == name }
      property ? property["value"]["value"] : false
    end
  end
end
