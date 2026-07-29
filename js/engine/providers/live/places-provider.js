import { unavailableProviderResult } from "./provider-result.js";

export class PlacesProvider {
  constructor({ providerId = "places-provider", label = "Places provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
  }

  async searchPlaces(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchPlaces");
  }

  async getPlaceDetails(placeId, options = {}) {
    void placeId;
    void options;
    return unavailableProviderResult(this.providerId, "getPlaceDetails");
  }
}

