import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home=await readFile(new URL("../js/pages/home-page.js",import.meta.url),"utf8");
const results=await readFile(new URL("../results.html",import.meta.url),"utf8");
assert.doesNotMatch(home,/openMissionFollowUp\s*\(/);
assert.match(home,/source:\s*"one_first_pass"/);
assert.match(home,/startMission\(mission, null\)/);
assert.ok(results.indexOf("pathwayOpportunityPanel")<results.indexOf("additionalServicesForm"));
assert.ok(results.indexOf("additionalServicesForm")<results.indexOf("bottomActions"));
assert.match(results,/id="revisionLead"/);
console.log("ONE first-pass flow: ok");
