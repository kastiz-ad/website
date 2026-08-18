import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildWorkMissionViewModel, isWorkMissionExperience } from "../js/ui/work-mission-experience.js";
import { createWorkMissionFoundation } from "../js/engine/work-mission-foundation.js";

const resultsSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../js/pages/home-page.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../results.css", import.meta.url), "utf8");

test("presentation routes before the generic results renderer", () => {
  assert.ok(resultsSource.indexOf("if (isWorkMissionExperience(currentResult))") < resultsSource.indexOf("else if (currentResult.resolutionPlan)"));
  assert.match(homeSource, /preserveWorkMissionType/);
  assert.match(homeSource, /createWorkMissionFoundation/);
});

test("presentation dashboard includes slides notes versions memory rehearsal and Q&A", () => {
  const missionFoundation = createWorkMissionFoundation("presentation", { topic:"ONE", audience:"Investors", duration:"10 minutes" });
  const model = buildWorkMissionViewModel({ type:"presentation", rawInput:"Prepare my investor presentation tomorrow", missionFoundation }, "en");
  assert.equal(model.slides.length, 10);
  assert.equal(model.qa.length, 7);
  assert.ok(model.artifacts.some((item) => item.label === "Speaker notes"));
  assert.match(resultsSource, /renderWorkMissionExperience/);
  assert.match(css, /\.work-memory-dialog/);
  assert.match(css, /\.work-practice/);
});

test("work mission UI supports English Korean and Spanish independently", () => {
  const input = { type:"presentation", rawInput:"Prepare my presentation tomorrow" };
  assert.equal(buildWorkMissionViewModel(input,"en").title,"Presentation Mission");
  assert.equal(buildWorkMissionViewModel(input,"ko").title,"발표 미션");
  assert.equal(buildWorkMissionViewModel(input,"es").title,"Misión de presentación");
});

test("meeting and interview use their own mission dashboard and primary action", () => {
  const meeting = buildWorkMissionViewModel({type:"meeting",rawInput:"Prepare my investor meeting tomorrow"},"en");
  const interview = buildWorkMissionViewModel({type:"interview",rawInput:"I have an interview tomorrow"},"en");
  assert.equal(meeting.primary,"START PREPARATION");
  assert.equal(interview.primary,"START MOCK INTERVIEW");
  assert.equal(isWorkMissionExperience({type:"travel"}),false);
});

test("work preparation remains local and never claims external execution", () => {
  for (const type of ["presentation","meeting","interview"]) {
    const foundation = createWorkMissionFoundation(type,{});
    assert.equal(foundation.executionState,"preparation-only");
    assert.deepEqual(foundation.externalActions,[]);
    assert.match(buildWorkMissionViewModel({type,missionFoundation:foundation},"en").preparationNotice,/No email, calendar event, file upload, or external action occurred/);
  }
});

test("work mission CSS includes compact responsive dashboard behavior", () => {
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /\.work-prepared>div/);
  assert.match(css, /\.work-slide-list/);
});
