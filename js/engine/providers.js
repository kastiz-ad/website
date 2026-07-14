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
    retrievedAt: new Date().toISOString(),
    requiresKey: false,
    requiresPartnerAccess: false,
    items: [],
    error: null,
    ...overrides
  };
}

const responseCache = new Map();
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function fetchJson(url, { timeout = 4500, retries = 1, cacheTtl = 300000, fetchImpl = fetch } = {}) {
  const cached = responseCache.get(url);
  if (cached && Date.now() - cached.savedAt < cacheTtl) return cached.value;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      const value = await response.json();
      responseCache.set(url, { savedAt: Date.now(), value });
      return value;
    } catch (error) {
      lastError = error;
      if (attempt < retries && error?.status !== 429) await delay(250 * (attempt + 1));
      else break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function fetchProviderResult({ provider, category, url, fallbackItems = [], options = {} }) {
  try {
    const data = await fetchJson(url, options);
    return createProviderResult(provider, category, { sourceStatus: "live_public_data", liveData: true, items: Array.isArray(data) ? data : [data] });
  } catch (error) {
    return createProviderResult(provider, category, {
      sourceStatus: "fallback_demo",
      liveData: false,
      items: fallbackItems,
      error: error?.name === "AbortError" ? "Request timed out" : "Live source unavailable"
    });
  }
}

export function clearProviderCache() { responseCache.clear(); }

export function getFreeProviderNames() {
  return Object.values(FREE_API_PROVIDERS).map(({ name }) => name);
}


