require "rails/engine"
require "view_component"

module Impulse
  module ViewComponents
    class Engine < ::Rails::Engine
      isolate_namespace Impulse::ViewComponents

      config.autoload_paths = %W[#{root}/lib]
      config.eager_load_paths = %W[#{root}/app/components]

      initializer "impulse_view_components.assets" do |app|
        if app.config.respond_to?(:assets)
          app.config.assets.precompile += %w[impulse_view_components.js impulse_view_components.css]
        end
      end
    end
  end
end
