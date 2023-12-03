require_relative "lib/impulse/view_components/version"

Gem::Specification.new do |spec|
  spec.name = "impulse_view_components"
  spec.version = Impulse::ViewComponents::VERSION
  spec.authors = ["abeidahmed"]
  spec.email = ["info@ambiki.com"]

  spec.summary = "View components for Ruby on Rails"
  spec.homepage = "https://github.com/Ambiki/impulse_view_components"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.1.4"

  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "https://github.com/Ambiki/impulse_view_components/blob/main/CHANGELOG.md"

  spec.files = Dir["CHANGELOG.md", "LICENSE.txt", "README.md", "lib/**/*", "app/**/*"]
  spec.require_paths = ["lib"]

  spec.add_runtime_dependency "view_component", "~> 3.4"
  spec.add_runtime_dependency "actionview", ">= 6.1.0"

  spec.add_development_dependency "capybara", "~> 3.39", ">= 3.39.2"
  spec.add_development_dependency "byebug", "~> 11.1", ">= 11.1.3"
  spec.add_development_dependency "selenium-webdriver", "~> 4.15"
  spec.add_development_dependency "webmock", "~> 3.18", ">= 3.18.1"
end
