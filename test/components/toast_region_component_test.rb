require "test_helper"

module Impulse
  class ToastRegionComponentTest < ApplicationTest
    test "renders a landmark named for its hotkey, as a manual popover for the top layer" do
      render_inline(Impulse::ToastRegionComponent.new)

      assert_selector "awc-toast-region#awc-toast-region.awc-toast-region[popover='manual'][role='region'][aria-label='Notifications (F8)']"
      # The element's defaults aren't restated (ADR 0006).
      refute_selector "awc-toast-region[placement]"
      refute_selector "awc-toast-region[hotkey]"
    end

    test "names its landmark for another hotkey" do
      render_inline(Impulse::ToastRegionComponent.new(hotkey: "F9"))

      assert_selector "awc-toast-region[hotkey='F9'][aria-label='Notifications (F9)']"
    end

    test "turns the hotkey off without one, and leaves it out of the name" do
      render_inline(Impulse::ToastRegionComponent.new(hotkey: nil))

      assert_selector "awc-toast-region[hotkey=''][aria-label='Notifications']"
    end

    test "renders the placement it is given" do
      render_inline(Impulse::ToastRegionComponent.new(placement: :bottom_end))

      assert_selector "awc-toast-region[placement='bottom-end']"
    end

    test "falls back to the element's placement for one it doesn't know" do
      render_inline(Impulse::ToastRegionComponent.new(placement: :middle))

      refute_selector "awc-toast-region[placement]"
    end

    test "renders an announcer for each politeness, empty until a toast shows" do
      render_inline(Impulse::ToastRegionComponent.new)

      assert_selector "[aria-live='polite'][aria-atomic='true'][data-target='awc-toast-region.politeAnnouncer']", text: "", visible: :all
      assert_selector "[aria-live='assertive'][aria-atomic='true'][data-target='awc-toast-region.assertiveAnnouncer']", text: "", visible: :all
    end

    test "renders the toast that toasts shown from JavaScript are built from" do
      render_inline(Impulse::ToastRegionComponent.new)

      assert_selector "template[data-target='awc-toast-region.template']", visible: :all
      # HTML4 parsing keeps a template's content as its children, where the page's HTML5 parser hides it.
      template = Nokogiri::HTML4.fragment(rendered_content).at_css("template")
      assert_equal 1, template.css("> awc-toast > .awc-toast-body > .awc-toast-message").size
      # Filled in from `showToast`'s `title`, or removed without one.
      assert_equal 1, template.css("> awc-toast > .awc-toast-body > .awc-toast-title:empty").size
    end

    test "renders the toasts it is given" do
      render_inline(Impulse::ToastRegionComponent.new) do |region|
        region.with_toast(variant: :success) { "Saved." }
        region.with_toast(variant: :warning, id: "cutoff") { "Too early." }
      end

      assert_selector "awc-toast-region > awc-toast[variant='success'] + awc-toast#cutoff[variant='warning']"
    end
  end
end
