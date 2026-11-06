ENV["RAILS_ENV"] = "test"

require "ostruct"
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

  # A saved record, so that a name ending in `[]` takes its `to_param` as the index.
  class Item
    include ActiveModel::Model

    def self.model_name
      ActiveModel::Name.new(self, nil, "Item")
    end

    attr_accessor :id, :fruit_id, :fruit_ids, :time_zone

    def persisted?
      true
    end
  end
end
