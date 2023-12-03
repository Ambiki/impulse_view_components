module Impulse
  class AutocompleteComponentPreview < ViewComponent::Preview
    # @display center true
    # @display max_width true
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    # @param clearable toggle
    def single_select(size: :md, placeholder: "Select a fruit", disabled: false, clearable: true)
      render(Impulse::AutocompleteComponent.new(:user, :fruit_id, selected: OpenStruct.new(value: "banana", text: "Banana"), size: size, placeholder: placeholder, disabled: disabled, clearable: clearable)) do |c|
        %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate].each_with_index do |fruit, index|
          c.with_option(value: fruit.downcase, text: fruit, disabled: (index % 4) == 0 && index != 0)
        end
      end
    end

    # @display center true
    # @display max_width true
    def single_ajax_select
      render(Impulse::AutocompleteComponent.new(:user, :fruit_id, src: "/users"))
    end

    # @display center true
    # @display max_width true
    # @param size select ["sm", "md", "lg"]
    # @param placeholder text
    # @param disabled toggle
    def multiple_select(size: :md, placeholder: "Select fruits", disabled: false)
      render(Impulse::AutocompleteComponent.new(:user, :fruit_ids, selected: [OpenStruct.new(value: "apple", text: "Apple"), OpenStruct.new(value: "mango", text: "Mango")], multiple: true, size: size, placeholder: placeholder, disabled: disabled)) do |c|
        %w[Apple Banana Guava Kiwi Litchi Mango Pomegranate].each do |fruit|
          c.with_option(value: fruit.downcase, text: fruit)
        end
      end
    end

    # @display center true
    # @display max_width true
    def grouped_options_single_select
      render(Impulse::AutocompleteComponent.new(:user, :country_id, selected: OpenStruct.new(value: "CN", text: "Canada"))) do |c|
        c.with_group(title: "North America") do |g|
          g.with_option(value: "US", text: "United States")
          g.with_option(value: "CN", text: "Canada")
        end
        c.with_group(title: "Europe") do |g|
          g.with_option(value: "DK", text: "Denmark")
          g.with_option(value: "DE", text: "Germany")
        end
      end
    end

    # @display center true
    # @display max_width true
    def grouped_options_multiple_select
      render(Impulse::AutocompleteComponent.new(:user, :country_ids, multiple: true)) do |c|
        c.with_group(title: "North America") do |g|
          g.with_option(value: "US", text: "United States")
          g.with_option(value: "CN", text: "Canada")
        end
        c.with_group(title: "Europe") do |g|
          g.with_option(value: "DK", text: "Denmark")
          g.with_option(value: "DE", text: "Germany")
        end
      end
    end

    # @display center true
    # @display max_width true
    def multiple_ajax_select
      render(Impulse::AutocompleteComponent.new(:user, :fruit_ids, src: "/users", selected: [OpenStruct.new(value: "arnold_winnie", text: "Arnold Winnie")], multiple: true))
    end

    # @display center true
    # @display max_width true
    def ajax_error
      render(Impulse::AutocompleteComponent.new(:user, :fruit_ids, src: "/invalid"))
    end

    # @display center true
    # @display max_width true
    def custom_blankslate
      render(Impulse::AutocompleteComponent.new(:user, :fruit_id)) do |c|
        c.with_blankslate { "There aren't any fruits in the basket!" }
      end
    end
  end
end
