const validEnvironment = (value = "") => ["development", "staging", "production", "preview", "test"].includes(value) ? value : "development";

export function runtimeConfig(env = {}) {
  const inferredEnvironment = env.CF_PAGES_BRANCH === "main" ? "production" : env.CF_PAGES_BRANCH ? "preview" : "development";
  const environment = validEnvironment(env.APP_ENV || inferredEnvironment);
  return Object.freeze({
    environment,
    isProduction: environment === "production",
    isPreview: environment === "preview",
    logLevel: env.LOG_LEVEL || (environment === "production" ? "info" : "debug"),
    upstreamTimeoutMs: Math.min(Math.max(Number(env.UPSTREAM_TIMEOUT_MS || 8000), 1000), 30000),
    release: env.CF_PAGES_COMMIT_SHA || env.RELEASE_SHA || "local",
    service: "kastiz-one-api"
  });
}
