import { unavailableProviderResult } from "./provider-result.js";

export class AccommodationProvider {
  constructor({ providerId = "accommodation-provider", label = "Accommodation provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "accommodation";
  }

  async searchAccommodations(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchAccommodations");
  }
}
