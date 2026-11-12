require "test_helper"
require "webmock/minitest"
require "capybara/rails"
require "capybara/minitest"
require "byebug"

WebMock.disable_net_connect!(allow_localhost: true)

Capybara.configure do |config|
  config.always_include_port = true
end

class ApplicationSystemTest < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome do |option|
    option.add_argument "no-sandbox"
  end

  def visit_preview(preview_name, **params)
    component_name = self.class.name.gsub("SystemTest", "")
    component_uri = component_name.underscore
    url = "/components/preview/#{component_uri}/#{preview_name}"
    query_string = params.map { |k, v| "#{k}=#{CGI.escape(v.to_s)}" }.join("&")
    url << "?#{query_string}" if query_string.present?
    visit(url)
  end

  # The description Chrome's accessibility tree gives the element `selector` matches, which a screen reader reads.
  def accessible_description(selector)
    browser = page.driver.browser
    document = browser.execute_cdp("DOM.getDocument")
    node = browser.execute_cdp("DOM.querySelector", nodeId: document["root"]["nodeId"], selector: selector)
    tree = browser.execute_cdp("Accessibility.getPartialAXTree", nodeId: node["nodeId"], fetchRelatives: false)
    tree["nodes"].first.dig("description", "value")
  end
end
