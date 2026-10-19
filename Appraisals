# Active Support before 8.1 passes `quirks_mode` to `JSON.generate`, which json 3 removed.
appraise "rails-7" do
  gem "rails", "~> 7.0.0"
  gem "sqlite3", "~> 1.4"
  gem "json", "< 3"
end

appraise "rails-7-1" do
  gem "rails", "~> 7.1.0"
  gem "sqlite3", "~> 1.4"
  gem "json", "< 3"
end

appraise "rails-8" do
  gem "rails", "~> 8.0.0"
  gem "sqlite3", ">= 2.1"
  gem "json", "< 3"
end
