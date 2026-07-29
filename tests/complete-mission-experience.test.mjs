import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("Complete Mission Experience adds an intentional lifecycle surface", async () => {
  const html = await read("../results.html");
  const js = await read("../js/pages/results-page.js");
  assert.match(html, /id="missionLifecyclePanel"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(js, /missionLifecycleCopy/);
  assert.match(js, /renderMissionLifecycle\(currentResult\)/);
  assert.match(js, /Search criteria are ready\. Live provider checks require approval or setup\./);
  assert.doesNotMatch(js, /Provider connected\./);
});

test("Complete Mission Experience supports confidence, empty states and calm errors", async () => {
  const js = await read("../js/pages/results-page.js");
  assert.match(js, /createMissionConfidenceCard/);
  assert.match(js, /Known limitations/);
  assert.match(js, /createIntelligentEmptyState/);
  assert.match(js, /Expand the search radius/);
  assert.match(js, /Your current mission is still available/);
});

test("Complete Mission Experience supports undo redo and visible history", async () => {
  const js = await read("../js/pages/results-page.js");
  assert.match(js, /pushMissionChangeHistory/);
  assert.match(js, /undoMissionEdit/);
  assert.match(js, /redoMissionEdit/);
  assert.match(js, /data-mission-redo/);
  assert.match(js, /mission-change-history/);
});

test("Complete Mission Experience CSS includes accessibility and reduced motion polish", async () => {
  const css = await read("../results.css");
  assert.match(css, /mission-lifecycle-panel/);
  assert.match(css, /mission-confidence-grid/);
  assert.match(css, /intelligent-empty-state/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@keyframes missionCardIn/);
});
