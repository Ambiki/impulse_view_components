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
