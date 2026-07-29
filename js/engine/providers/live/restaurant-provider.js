import { unavailableProviderResult } from "./provider-result.js";

export class RestaurantProvider {
  constructor({ providerId = "restaurant-provider", label = "Restaurant provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "restaurant";
  }

  async searchRestaurants(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchRestaurants");
  }
}
