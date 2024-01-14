source "https://rubygems.org"

gemspec

rails_version = ">= 6.1"

gem "actionview", rails_version
gem "activesupport", rails_version
gem "activerecord", rails_version
gem "appraisal", "~> 2.5"
gem "bootsnap", require: false
gem "lookbook", "~> 2.0", ">= 2.0.5"
gem "puma", "~> 6.4"
gem "rake", "~> 13.0"
gem "railties", rails_version
gem "sprockets"
gem "sprockets-rails"
gem "sqlite3", "~> 1.4"

group :development, :test do
  gem "rspec", "~> 3.0"
end

group :development do
  gem "solargraph-standardrb"
  gem "standard", "~> 1.3"
end

group :test do
  gem "selenium-webdriver", "~> 4.16"
end
