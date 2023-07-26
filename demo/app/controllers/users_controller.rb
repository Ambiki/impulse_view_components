class UsersController < ApplicationController
  layout false

  def index
    @users = [
      {
        id: SecureRandom.urlsafe_base64,
        name: "Mike Atherton"
      },
      {
        id: SecureRandom.urlsafe_base64,
        name: "Arnold Winnie"
      },
      {
        id: SecureRandom.urlsafe_base64,
        name: "Safety Roger"
      },
      {
        id: SecureRandom.urlsafe_base64,
        name: "Connway Hathway"
      },
      {
        id: SecureRandom.urlsafe_base64,
        name: "Geroud Fleming"
      }
    ]

    if (query = params[:q]).present?
      @users = @users.filter { |user| user[:name].downcase.include?(query.downcase) }
    end
  end
end
