require "test_helper"

module Impulse
  class SpinnerComponentTest < ApplicationTest
    test "renders spinner" do
      render_inline(Impulse::SpinnerComponent.new)

      assert_selector "[role='status'].spinner-border.text-secondary"
      assert_selector "[role='status'][aria-label='Loading']"
    end

    test "variant can be changed" do
      render_inline(Impulse::SpinnerComponent.new(variant: :primary))

      assert_selector ".text-primary"
    end

    test "custom classes can be passed" do
      render_inline(Impulse::SpinnerComponent.new(class: "custom-class"))

      assert_selector ".spinner-border.custom-class"
    end

    test "fallbacks to default variant if variant is invalid" do
      render_inline(Impulse::SpinnerComponent.new(variant: :invalid))

      assert_selector ".text-secondary"
    end
  end
end
