export const FREE_API_PROVIDERS = Object.freeze({
  weather: { name: "Open-Meteo", requiresKey: false },
  currency: { name: "Frankfurter", requiresKey: false },
  country: { name: "REST Countries", requiresKey: false },
  maps: { name: "OpenStreetMap Nominatim", requiresKey: false },
  knowledge: { name: "Wikipedia", requiresKey: false }
});

export function createProviderResult(provider, category, overrides = {}) {
  return {
    provider,
    category,
    sourceStatus: "prototype_adapter",
    liveData: false,
    requiresKey: false,
    requiresPartnerAccess: false,
    items: [],
    error: null,
    ...overrides
  };
}

export async function fetchJson(url, { timeout = 4500, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export function getFreeProviderNames() {
  return Object.values(FREE_API_PROVIDERS).map(({ name }) => name);
}


