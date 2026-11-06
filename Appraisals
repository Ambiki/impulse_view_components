# Active Support before 8.1 passes `quirks_mode` to `JSON.generate`, which json 3 removed.
appraise "rails-7-1" do
  gem "rails", "~> 7.1.0"
  gem "sqlite3", "~> 1.4"
  gem "json", "< 3"
end

appraise "rails-7-2" do
  gem "rails", "~> 7.2.0"
  gem "sqlite3", ">= 2.1"
  gem "json", "< 3"
end

appraise "rails-8" do
  gem "rails", "~> 8.0.0"
  gem "sqlite3", ">= 2.1"
  gem "json", "< 3"
end

# Rails' main branch, so that a change to the private form tag API the form builder builds on (ADR 0011) shows up
# before a release. Its lockfile isn't committed: CI resolves main afresh on every run.
appraise "rails-main" do
  # Every Rails gem the Gemfile names comes from main, or Bundler looks for the alpha on rubygems.org.
  %w[rails railties actionview activesupport activerecord].each do |name|
    gem name, github: "rails/rails", branch: "main"
  end
  gem "sqlite3", ">= 2.1"
end
