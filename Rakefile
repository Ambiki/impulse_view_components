require "bundler/gem_tasks"
require "rake/testtask"

namespace :test do
  desc "Run all tests"
  task all: [
    :components,
    :system
  ]

  Rake::TestTask.new(:components) do |t|
    t.libs << "test"
    t.libs << "lib"
    t.test_files = FileList[
      "test/components/**/*_test.rb",
      "test/forms/**/*_test.rb"
    ]
  end

  Rake::TestTask.new(:system) do |t|
    t.libs << "test"
    t.libs << "lib"
    t.test_files = FileList["test/system/**/*_test.rb"]
  end
end

task :test do
  Rake::Task["test:all"].invoke
end

task default: :test
