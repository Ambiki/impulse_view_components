module Impulse
  module Dialog
    class HeaderComponent < ApplicationComponent
      def initialize(title:, **system_args)
        @title = title
        @system_args = system_args
        @system_args[:tag] = :div
      end
    end
  end
end
