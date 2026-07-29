import { unavailableProviderResult } from "./provider-result.js";

export class RouteProvider {
  constructor({ providerId = "route-provider", label = "Route provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
  }

  async computeRoute(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "computeRoute");
  }

  async computeRouteMatrix(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "computeRouteMatrix");
  }
}

