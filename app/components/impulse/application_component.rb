module Impulse
  class ApplicationComponent < ViewComponent::Base
    include Helpers::AttributesHelper

    def self.generate_id
      "#{name.demodulize.underscore.dasherize}-#{SecureRandom.uuid}"
    end

    private

    def fetch_or_fallback(variant_keys, given_value, default_value)
      if given_value && variant_keys.include?(given_value.to_sym)
        given_value.to_sym
      else
        default_value
      end
    end
  end
end
