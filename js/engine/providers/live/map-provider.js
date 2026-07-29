import { unavailableProviderResult } from "./provider-result.js";

export class MapProvider {
  constructor({ providerId = "map-provider", label = "Map provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
  }

  async geocode(query, options = {}) {
    void query;
    void options;
    return unavailableProviderResult(this.providerId, "geocode");
  }

  async loadMap(container, options = {}) {
    void container;
    void options;
    return unavailableProviderResult(this.providerId, "loadMap");
  }

  async renderMarkers(map, markers = [], options = {}) {
    void map;
    void markers;
    void options;
    return unavailableProviderResult(this.providerId, "renderMarkers");
  }
}

