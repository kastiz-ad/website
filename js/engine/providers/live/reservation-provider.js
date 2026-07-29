import { unavailableProviderResult } from "./provider-result.js";

export class ReservationProvider {
  constructor({ providerId = "reservation-provider", label = "Reservation provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "reservation";
  }

  async searchAvailability(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchAvailability");
  }

  async prepareReservation(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "prepareReservation");
  }

  async confirmReservation(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "confirmReservation");
  }
}
