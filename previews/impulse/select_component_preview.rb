module Impulse
  class SelectComponentPreview < ViewComponent::Preview
    # @display center true
    # @display max_width true
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    # @param clearable toggle
    def single_select(size: :md, placeholder: "Select a fruit", disabled: false, clearable: true)
      render(
        Impulse::SelectComponent.new(
          :user,
          :fruit_id,
          ["Apple", "Banana", "Guava", "Kiwi", "Litchi", "Mango", "Pomegranate"],
          selected: "Kiwi",
          size: size,
          placeholder: placeholder,
          disabled: disabled,
          clearable: clearable
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

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_single_select(required: false)
      render_with_template(locals: { required: required })
    end

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_single_select_block_options(required: false)
      render_with_template(locals: { required: required })
    end

    # @display center true
    # @display max_width true
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    # @param clearable toggle
    def multiple_select(size: :md, placeholder: "Select fruits", disabled: false, clearable: true)
      render(
        Impulse::SelectComponent.new(
          :user,
          :fruit_ids,
          ["Apple", "Banana", "Guava", "Kiwi", "Litchi", "Mango", "Pomegranate"],
          selected: ["Kiwi", "Mango"],
          multiple: true,
          size: size,
          placeholder: placeholder,
          disabled: disabled,
          clearable: clearable
        )
      )
    end

    # @display center true
    # @display max_width true
    # @param required toggle
    def form_with_multiple_select(required: false)
      render_with_template(locals: { required: required })
    end

    # @display center true
    # @display max_width true
    # @param multiple toggle
    def option_description(multiple: false)
      render(
        Impulse::SelectComponent.new(
          :user,
          :fruit_id,
          [["Apple", "apple", { description: "An apple a day keeps the doctor away." }], ["Banana", "banana", { description: "Rich in carbohydrates." }], ["Guava", "guava", { description: "Grows best in tropical or subtropical climates." }]],
          multiple:
        )
      )
    end

    # @display center true
    # @display max_width true
    def block_options
      render(Impulse::SelectComponent.new(:user, :fruit_id, selected: "kiwi")) do |c|
        %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate].each do |fruit|
          c.with_option(value: fruit.downcase, text: fruit)
        end
      end
    end

    # @display center true
    # @display max_width true
    def grouped_options_single_select
      grouped_options = [
        ["North America", [["United States", "US"], ["Canada", "CN", { disabled: true }]]],
        ["Europe", ["Denmark", "Germany"]]
      ]
      render(Impulse::SelectComponent.new(:user, :fruit_id, grouped_options, selected: "US"))
    end

    # @display center true
    # @display max_width true
    def grouped_options_multiple_select
      grouped_options = [
        ["North America", [["United States", "US"], ["Canada", "CN", { disabled: true }]]],
        ["Europe", ["Denmark", "Germany"]]
      ]
      render(Impulse::SelectComponent.new(:user, :fruit_id, grouped_options, selected: ["US"], multiple: true))
    end

    # @display center true
    # @display max_width true
    def custom_blankslate
      render(Impulse::SelectComponent.new(:user, :fruit_id)) do |c|
        c.with_blankslate { "Nothing found" }
      end
    end
  end
end
