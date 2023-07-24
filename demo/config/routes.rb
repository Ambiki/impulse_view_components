Rails.application.routes.draw do
  mount Lookbook::Engine, at: "/components"
end
