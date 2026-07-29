import { buildTravelWorldIntelligence } from "./js/engine/world-intelligence/world-intelligence-foundation-v24.js?v=20260727-v24";

const params = new URLSearchParams(location.search);
const isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
const allowed = isLocal || params.get("founder") === "1" || params.get("internal") === "1";
const root = document.getElementById("diagnosticsRoot");
const lead = document.getElementById("diagnosticsLead");
const content = document.getElementById("diagnosticsContent");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

if (!allowed) {
  content.innerHTML = `<p>This diagnostics surface is blocked on public access. It is not a customer-facing page.</p>`;
} else {
  root.classList.remove("is-locked");
  lead.textContent = "Founder-only diagnostics preview. This shows adapter health, source states, cache health, and V24 confidence.";
  const scenario = params.get("v24WorldScenario") || "mixed-source";
  const foundation = buildTravelWorldIntelligence({
    country: "JP",
    destination: { city: "Sapporo", country: "Japan", continent: "Asia" },
    countryProfile: { code: "JP", name: "Japan", currency: "JPY", continent: "Asia" },
    v24WorldScenario: scenario
  });
  const breakdown = foundation.sourceBreakdown || {};
  content.innerHTML = `
    <div class="diagnostics-grid">
      <div class="diagnostics-tile"><span>Cache health</span><strong>${escapeHtml(foundation.cache?.health)}</strong></div>
      <div class="diagnostics-tile"><span>Confidence</span><strong>${Math.round(Number(foundation.averageConfidence || 0) * 100)}%</strong></div>
      <div class="diagnostics-tile"><span>Fixture mode</span><strong>${foundation.fixtureMode ? "ON" : "OFF"}</strong></div>
      <div class="diagnostics-tile"><span>Verified</span><strong>${Number(breakdown.verified_live || 0)}</strong></div>
      <div class="diagnostics-tile"><span>Public</span><strong>${Number(breakdown.cached_public || 0)}</strong></div>
      <div class="diagnostics-tile"><span>Unavailable</span><strong>${Number(breakdown.unavailable || 0)}</strong></div>
    </div>
    <section class="adapter-list">
      ${foundation.adapters.map((adapter) => `
        <div class="adapter-row">
          <span>${escapeHtml(adapter.label)}</span>
          <small>${escapeHtml(adapter.providerType)} · ${escapeHtml(adapter.status)} · ${escapeHtml(adapter.mode)}</small>
        </div>
      `).join("")}
    </section>
  `;
}
