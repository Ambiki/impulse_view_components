require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "impulse/view_components/engine"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Demo
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults Rails::VERSION::MAJOR + (Rails::VERSION::MINOR / 10.0)

    config.view_component.default_preview_layout = "preview"
    config.view_component.show_previews = true
    config.view_component.preview_paths << Rails.root.join("../previews")

    config.lookbook.project_name = "Impulse View Components"
    config.lookbook.debug_menu = true
    config.lookbook.preview_params_options_eval = true

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Don't generate system test files.
    config.generators.system_tests = nil
  end
end
