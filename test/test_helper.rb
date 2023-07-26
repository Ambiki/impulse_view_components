ENV["RAILS_ENV"] = "test"

require "minitest/autorun"
require "rails"
require "rails/test_help"
require "view_component/test_helpers"
require "view_component/test_case"
require "impulse/view_components"

require File.expand_path("../demo/config/environment.rb", __dir__)

class ApplicationTest < ViewComponent::TestCase
  class User
    include ActiveModel::Model

    def self.model_name
      ActiveModel::Name.new(self.class, nil, "User")
    end

    attr_reader :fruit_id, :fruit_ids

    def initialize(fruit_id: nil, fruit_ids: [])
      @fruit_id = fruit_id
      @fruit_ids = fruit_ids
    end
  end
end
