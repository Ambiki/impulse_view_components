module Impulse
  class BaseRenderer < ViewComponent::Base
    SELF_CLOSING_TAGS = [:area, :base, :br, :col, :embed, :hr, :img, :input, :link, :meta, :param, :source, :track, :wbr].freeze

    def initialize(tag:, **system_args)
      @tag = tag
      @system_args = system_args
      @system_args[:"data-impulse-view-component"] = ""
    end

    def call
      if SELF_CLOSING_TAGS.include?(@tag)
        tag(@tag, **@system_args)
      else
        content_tag(@tag, content, **@system_args)
      end
    end
  end
end
