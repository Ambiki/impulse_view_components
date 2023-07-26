module Impulse
  class SelectComponentPreview < ViewComponent::Preview
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    def single_select(size: :md, placeholder: "Select a fruit", disabled: false)
      render(
        Impulse::SelectComponent.new(
          :user,
          :fruit_id,
          %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate],
          selected: "Kiwi",
          size: size,
          placeholder: placeholder,
          disabled: disabled
        )
      )
    end

    class User
      include ActiveModel::Model

      attr_reader :fruit_id, :fruit_ids

      def initialize(fruit_id: nil, fruit_ids: [])
        @fruit_id = fruit_id
        @fruit_ids = fruit_ids
      end
    end

    # @!group form_with_single_select
    # @label Select
    def form_with_single_select
      render_with_template
    end

    # @label Block options
    def form_with_single_select_block_options
      render_with_template
    end
    # @!endgroup form_with_single_select

    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    def multiple_select(size: :md, placeholder: "Select fruits", disabled: false)
      render(
        Impulse::SelectComponent.new(
          :user,
          :fruit_ids,
          %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate],
          selected: ["Kiwi", "Mango"],
          multiple: true,
          size: size,
          placeholder: placeholder,
          disabled: disabled
        )
      )
    end

    def form_with_multiple_select
      render_with_template
    end

    def block_options
      render(Impulse::SelectComponent.new(:user, :fruit_id, selected: "kiwi")) do |c|
        %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate].each do |fruit|
          c.with_option(value: fruit.downcase, text: fruit)
        end
      end
    end

    def custom_blankslate
      render(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_blankslate { "Nothing found" }
      end
    end
  end
end
