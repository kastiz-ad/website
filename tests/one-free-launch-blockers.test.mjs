import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { classifyMission } from "../js/engine/mission-classification.js";
import { rateLimit } from "../functions/api/v1/_lib/security.js";

test("saved device trips restore stored results without entering the ONE-DEMO reference route", async () => {
  const source = await fs.readFile(new URL("../js/pages/home-page.js", import.meta.url), "utf8");
  const start = source.indexOf("const reopenPrototypeMission");
  const end = source.indexOf("const detectPrototypeReferenceInImage", start);
  const restore = source.slice(start, end);
  assert.match(restore, /sessionStorage\.setItem\(STORAGE_KEYS\.results, JSON\.stringify\(record\.result\)\)/);
  assert.match(restore, /results\.html\?savedTrip=1&lang=/);
  assert.doesNotMatch(restore, /results\.html\?reference=/);
});

test("common interview prompts route to the existing interview preparation experience", () => {
  const prompts = [
    "I have an interview tomorrow. Prepare me.",
    "Prepare me for a product manager interview.",
    "Run a mock interview with me.",
    "내일 면접 준비해 줘.",
    "모의 면접을 준비해 주세요.",
    "Prepárame para una entrevista mañana."
  ];
  for (const prompt of prompts) assert.equal(classifyMission(prompt), "interview", prompt);
});

test("home mission persistence keeps interview routing ahead of broad career follow-up state", async () => {
  const [home, results] = await Promise.all([
    fs.readFile(new URL("../js/pages/home-page.js", import.meta.url), "utf8"),
    fs.readFile(new URL("../js/pages/results-page.js", import.meta.url), "utf8")
  ]);
  assert.match(home, /\["presentation", "meeting", "interview"\]\.includes\(classifiedType\)/);
  assert.match(home, /payload\.type = classifiedType/);
  assert.match(home, /payload\.missionType = classifiedType/);
  assert.match(results, /isExplicitInterviewPreparation\(explicitPrompt\)/);
  assert.match(results, /type: "interview", missionType: "interview", domain: "work"/);
});

test("public account entry points are unavailable without offering a broken auth flow", async () => {
  const [home, styles, upgradeStyles, login] = await Promise.all([
    fs.readFile(new URL("../index.html", import.meta.url), "utf8"),
    fs.readFile(new URL("../style.css", import.meta.url), "utf8"),
    fs.readFile(new URL("../upgrade.css", import.meta.url), "utf8"),
    fs.readFile(new URL("../login.js", import.meta.url), "utf8")
  ]);
  assert.match(home, /id="loginButton"[^>]*hidden[^>]*aria-hidden="true"/);
  assert.match(styles, /#loginButton\[hidden\]/);
  assert.match(upgradeStyles, /a\[href="login\.html"\].*display:\s*none/);
  assert.match(login, /Accounts are unavailable during ONE Free public beta/);
  assert.match(login, /button\.disabled = true/);
});

test("production API requests fail closed when the rate limiter binding is absent", async () => {
  const context = { env: { APP_ENV: "production" }, request: new Request("https://kastiz.com/api/v1/test") };
  await assert.rejects(() => rateLimit(context), (error) => error?.status === 503 && error?.code === "rate_limiter_unavailable");
});

test("non-production local tests may run without a rate limiter binding", async () => {
  const context = { env: { APP_ENV: "test" }, request: new Request("http://127.0.0.1/api/v1/test") };
  await assert.doesNotReject(() => rateLimit(context));
});
