require "test_helper"
require "json"

module Impulse
  # What each component's markup asks of its element: the targets, actions and roles in it. The element tests build
  # their markup by hand, and check it against these files (`src/internal/test_markup.ts`), so a template that changes
  # what its element reads fails here first, then there, until the hand-built markup follows.
  #
  # Render them again with `UPDATE_MARKUP=1 bundle exec rake test:components`.
  class MarkupContractTest < ApplicationTest
    DIRECTORY = File.expand_path("../fixtures/markup", __dir__)
    MARKS = %w[data-target data-action data-behavior role popover].freeze
    Option = Struct.new(:value, :text)
    FRUITS = [Option.new("1", "Apple"), Option.new("2", "Banana"), Option.new("3", "Cherry")].freeze

    def self.contract(name, &render)
      test "#{name} asks of its element what #{name}.json says" do
        instance_exec(&render)
        path = File.join(DIRECTORY, "#{name}.json")
        contract = JSON.pretty_generate(marked_elements(rendered_content)) + "\n"
        File.write(path, contract) if ENV["UPDATE_MARKUP"]

        assert_equal File.read(path), contract, "Render it again with UPDATE_MARKUP=1, then update the element's test."
      end
    end

    contract "autocomplete_single" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, selected: FRUITS.first, required: true)) do |c|
        FRUITS.each { |fruit| c.with_option(value: fruit.value, text: fruit.text) }
      end
    end

    contract "autocomplete_multiple" do
      component = Impulse::AutocompleteComponent.new(:user, :fruit_ids, multiple: true, selected: [FRUITS.first])
      render_inline(component) do |c|
        FRUITS.each { |fruit| c.with_option(value: fruit.value, text: fruit.text) }
      end
    end

    contract "autocomplete_ajax" do
      render_inline(Impulse::AutocompleteComponent.new(:user, :fruit_id, src: "/fruits"))
    end

    contract "popover" do
      render_inline(Impulse::PopoverComponent.new(title: "Filters")) do |c|
        c.with_trigger { "Open" }
        c.with_body { "Body" }
      end
    end

    contract "dialog" do
      render_inline(Impulse::DialogComponent.new(title: "Edit your profile")) do |c|
        c.with_body { "Body" }
      end
    end

    contract "toast" do
      render_inline(Impulse::ToastComponent.new) do |c|
        c.with_title { "Saved" }
        "Your changes are saved."
      end
    end

    contract "toast_region" do
      render_inline(Impulse::ToastRegionComponent.new)
    end

    private

    # Every element with a target, an action, a behavior, a role or `popover`, a template's content included, as the
    # element tests read their own markup. The first is the element itself.
    def marked_elements(html)
      Nokogiri::HTML.fragment(html).css("*").filter_map do |node|
        next unless MARKS.any? { |mark| node.key?(mark) }

        {
          tag: node.name,
          target: node["data-target"],
          actions: node["data-action"].to_s.split.sort,
          behavior: node["data-behavior"],
          role: node["role"],
          popover: node["popover"]
        }
      end.uniq
    end
  end
end
