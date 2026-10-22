require "test_helper"

module Impulse
  class FormHelperTest < ApplicationTest
    class FormComponent < ViewComponent::Base
      erb_template <<~ERB
        <%= impulse_form_with(model: @user, url: "/users") do |f| %>
          <%= f.select :fruit_id, ["Apple", "Mango", "Guava"] %>
        <% end %>
      ERB

      def initialize(user:)
        @user = user
      end
    end

    test "impulse_form_with works inside a component template" do
      render_inline(FormComponent.new(user: User.new(fruit_id: "Mango")))

      assert_selector "form[action='/users'] awc-autocomplete"
      assert_selector "form [role='option']", count: 3, visible: false
      assert_selector "form input[type='hidden'][name='user[fruit_id]'][value='Mango']", visible: false
    end
  end
end
