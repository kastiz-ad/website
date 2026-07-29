import { unavailableProviderResult } from "./provider-result.js";

export class FlightProvider {
  constructor({ providerId = "flight-provider", label = "Flight provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "flight";
  }

  async searchFlights(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchFlights");
  }
}
