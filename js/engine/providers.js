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


