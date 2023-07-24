ENV["RAILS_ENV"] = "test"

require "minitest/autorun"
require "rails"
require "rails/test_help"
require "view_component/test_helpers"
require "view_component/test_case"
require "impulse/view_components"

require File.expand_path("../demo/config/environment.rb", __dir__)

class ApplicationTest < ViewComponent::TestCase
end
