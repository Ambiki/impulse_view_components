Rails.application.routes.draw do
  mount Lookbook::Engine, at: "/components"

  resources :users, only: %i[index]
end
