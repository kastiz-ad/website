import { unavailableProviderResult } from "./provider-result.js";

export class ExperienceProvider {
  constructor({ providerId = "experience-provider", label = "Experience provider" } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "experience";
  }

  async searchExperiences(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "searchExperiences");
  }
}
