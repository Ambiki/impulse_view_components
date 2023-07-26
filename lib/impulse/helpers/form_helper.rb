module Impulse
  module Helpers
    module FormHelper
      def impulse_form_with(**args, &block)
        form_with(**args, builder: Impulse::Forms::Builder, &block)
      end
    end
  end
end
