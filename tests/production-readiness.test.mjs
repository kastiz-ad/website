import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ApiError, fetchWithTimeout } from "../functions/api/v1/_lib/http.js";
import { createLogger } from "../functions/api/v1/_lib/logger.js";
import { runtimeConfig } from "../functions/api/v1/_lib/runtime-config.js";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");

const file = path => readFile(join(root, path), "utf8");

test("runtime config separates production, preview and development", () => {
  assert.equal(runtimeConfig({ CF_PAGES_BRANCH: "main" }).environment, "production");
  assert.equal(runtimeConfig({ CF_PAGES_BRANCH: "funding-demo-final" }).environment, "preview");
  assert.equal(runtimeConfig({ APP_ENV: "staging" }).environment, "staging");
  assert.equal(runtimeConfig({ APP_ENV: "nonsense" }).environment, "development");
});

test("runtime config clamps upstream timeout to safe bounds", () => {
  assert.equal(runtimeConfig({ UPSTREAM_TIMEOUT_MS: "10" }).upstreamTimeoutMs, 1000);
  assert.equal(runtimeConfig({ UPSTREAM_TIMEOUT_MS: "999999" }).upstreamTimeoutMs, 30000);
  assert.equal(runtimeConfig({ UPSTREAM_TIMEOUT_MS: "9000" }).upstreamTimeoutMs, 9000);
});

test("structured logger redacts secrets before writing JSON", () => {
  const originalLog = console.log;
  const lines = [];
  console.log = line => lines.push(line);
  try {
    createLogger({ requestId: "req-1", environment: "test", logLevel: "debug" }).info("provider_test", {
      provider: "google",
      latency: 12,
      apiKey: "secret-key-value",
      nested: { accessToken: "token-value", safe: "visible" }
    });
  } finally {
    console.log = originalLog;
  }
  assert.equal(lines.length, 1);
  const payload = JSON.parse(lines[0]);
  assert.equal(payload.requestId, "req-1");
  assert.equal(payload.provider, "google");
  assert.equal(payload.apiKey, "[redacted]");
  assert.equal(payload.nested.accessToken, "[redacted]");
  assert.equal(payload.nested.safe, "visible");
});

test("fetchWithTimeout converts aborts into a user-safe ApiError", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, { signal } = {}) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    });
  });
  try {
    await assert.rejects(
      fetchWithTimeout("https://example.invalid", {}, { timeoutMs: 1, errorCode: "test_timeout" }),
      error => error instanceof ApiError && error.status === 504 && error.code === "test_timeout"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("backend upstream calls use the shared timeout wrapper", async () => {
  const authSource = await file("functions/api/v1/_lib/auth.js");
  const databaseSource = await file("functions/api/v1/_lib/database.js");
  assert.match(authSource, /fetchWithTimeout/);
  assert.match(databaseSource, /fetchWithTimeout/);
});

test("deployment headers include hardened policy and configured provider origins", async () => {
  const headers = await file("_headers");
  assert.match(headers, /Permissions-Policy: camera=\(\), geolocation=\(self\), microphone=\(\)/);
  assert.match(headers, /https:\/\/maps\.googleapis\.com/);
  assert.match(headers, /https:\/\/places\.googleapis\.com/);
  assert.match(headers, /https:\/\/routes\.googleapis\.com/);
  assert.match(headers, /frame-ancestors 'none'/);
});

test("CI workflow and package scripts run static checks, security scan and tests", async () => {
  assert.equal(existsSync(join(root, ".github/workflows/ci.yml")), true);
  const workflow = await file(".github/workflows/ci.yml");
  const pkg = JSON.parse(await file("package.json"));
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /npm run security:scan/);
  assert.match(workflow, /npm test/);
  assert.match(pkg.scripts.ci, /security:scan/);
});

test("production readiness report is honest about remaining launch risk", async () => {
  const report = await file("PRODUCTION_READINESS_REPORT.md");
  assert.match(report, /Do not claim production-ready/i);
  assert.match(report, /62 \/ 100/);
  assert.match(report, /remaining risks/i);
});
