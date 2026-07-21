import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home=await readFile(new URL("../js/pages/home-page.js",import.meta.url),"utf8");
const results=await readFile(new URL("../results.html",import.meta.url),"utf8");
const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
const entry=await readFile(new URL("../script.js",import.meta.url),"utf8");
assert.doesNotMatch(home,/openMissionFollowUp\s*\(/);
assert.match(home,/source:\s*"one_first_pass"/);
assert.match(home,/startMission\(mission, null\)/);
assert.match(html,/script\.js\?v=20260722-worldwide-trilingual-3/);
assert.match(entry,/home-page\.js\?v=20260722-worldwide-trilingual-3/);
assert.ok(results.indexOf("pathwayOpportunityPanel")<results.indexOf("additionalServicesForm"));
assert.ok(results.indexOf("additionalServicesForm")<results.indexOf("bottomActions"));
assert.match(results,/id="revisionLead"/);
console.log("ONE first-pass flow: ok");
