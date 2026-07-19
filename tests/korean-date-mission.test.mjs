import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyMission } from "../js/engine/mission-classification.js";
import { buildExperienceIntelligence } from "../js/engine/experience-intelligence/experience-intelligence-engine.js";

for(const mission of ["여친 주말 데이트","여자친구와 데이트","남친 기념일","weekend date with my girlfriend"]){
  assert.equal(classifyMission(mission),"lifestyle");
}
const review=buildExperienceIntelligence({mission:"여친 주말 데이트",language:"ko"});
assert.match(review.choices[0].text,/도자기 공방/);
assert.ok(review.choices.every(item=>item.command));
const followup=await readFile(new URL("../js/ui/mission-followup.js",import.meta.url),"utf8");
const home=await readFile(new URL("../js/pages/home-page.js",import.meta.url),"utf8");
assert.match(followup,/lifestyle:\s*\[/);
assert.match(home,/missionForm\.requestSubmit\(\)/);
console.log("korean date mission: ok");
