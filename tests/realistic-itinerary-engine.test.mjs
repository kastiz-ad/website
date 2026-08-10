import assert from "node:assert/strict";
import test from "node:test";
import { DESTINATION_KNOWLEDGE, buildRealisticItinerary, mapMarkersForItinerary, normalizeTripPurpose, validateItineraryQuality } from "../js/engine/itinerary/realistic-itinerary-engine.js";

const requiredCities=["tokyo","new_york","los_angeles","seoul","paris","london","bangkok","singapore","rome","barcelona","sydney"];
const generic=/local breakfast|local lunch|dinner near hotel|neighborhood walk|key attraction|main attraction|evening view/i;

test("all advertised reliable demo cities have structured destination knowledge",()=>{
  assert.deepEqual(Object.keys(DESTINATION_KNOWLEDGE).sort(),[...requiredCities].sort());
  for(const id of requiredCities){const city=DESTINATION_KNOWLEDGE[id];assert.equal(city.id,id);assert.ok(city.currency);assert.ok(city.airports.length);assert.ok(city.districts.length>=5);assert.ok(city.attractions.length>=10);assert.ok(city.localSpecialties.length>=7);assert.ok(city.hotelDistricts.length);assert.ok(city.transport);for(const item of city.attractions){assert.ok(item.id);assert.ok(Number.isFinite(item.lat));assert.ok(Number.isFinite(item.lng));}}
});
test("every curated destination sustains a varied seven-day plan",()=>{
  for(const destinationId of requiredCities){const plan=buildRealisticItinerary({destinationId,durationDays:7,mission:`balanced culture and food trip to ${destinationId}`});assert.equal(plan.quality.valid,true,`${destinationId}: ${plan.quality.issues.join(", ")} ${JSON.stringify(plan.quality.genericLabels)}`);assert.equal(new Set(plan.days.map(day=>day.theme)).size,7);assert.equal(new Set(plan.days.flatMap(day=>day.activities.map(item=>item.id))).size,plan.days.flatMap(day=>day.activities).length);}
});


test("Tokyo seven-day cultural plan has distinct geographic themes and no repeats",()=>{
  const plan=buildRealisticItinerary({destinationId:"tokyo",durationDays:7,mission:"Plan a 7-day cultural trip to Tokyo."});
  assert.equal(plan.days.length,7);assert.equal(plan.quality.valid,true,plan.quality.issues.join(", "));assert.equal(new Set(plan.days.map(day=>day.theme)).size,7);assert.equal(plan.days[0].isArrival,true);assert.equal(plan.days.at(-1).isDeparture,true);
  assert.equal(new Set(plan.days.flatMap(day=>day.activities.map(item=>item.id))).size,plan.days.flatMap(day=>day.activities).length);
  assert.equal(new Set(plan.days.flatMap(day=>day.meals.map(item=>item.id))).size,21);
  assert.ok(plan.days.every(day=>day.weatherAlternative));
});

test("New York business plan prioritizes work blocks and coherent districts",()=>{
  const plan=buildRealisticItinerary({destinationId:"new_york",durationDays:5,mission:"Plan a five-day business trip to New York for an executive with meetings."});
  assert.equal(plan.purpose,"business");assert.ok(plan.days.slice(0,-1).every(day=>day.slots.some(slot=>slot.kind==="work")));assert.match(plan.days[0].theme,/Midtown|Lower Manhattan/);assert.equal(plan.quality.valid,true);
});

test("Los Angeles family plan stays paced and excludes nightlife activities",()=>{
  const plan=buildRealisticItinerary({destinationId:"los_angeles",durationDays:5,mission:"Plan a family trip to Los Angeles with kids.",travelers:4});
  assert.equal(plan.purpose,"family");assert.equal(plan.pace,"balanced");assert.ok(plan.days.every(day=>day.activities.length<=2));assert.ok(plan.days.every(day=>!day.activities.some(item=>/nightlife/i.test(item.kind))));assert.equal(plan.quality.valid,true);
});

test("food and romantic purpose wording normalizes across required languages",()=>{
  assert.equal(normalizeTripPurpose("\uB3C4\uCFC4 7\uC77C \uBBF8\uC2DD \uC5EC\uD589\uC744 \uACC4\uD68D\uD574\uC918."),"food");
  assert.equal(normalizeTripPurpose("Organiza un viaje romantico de cinco dias a Paris."),"romantic");
  assert.equal(normalizeTripPurpose("Organise un voyage d'affaires de quatre jours a Seoul."),"business");
  const food=buildRealisticItinerary({destinationId:"tokyo",durationDays:7,mission:"\uB3C4\uCFC4 7\uC77C \uBBF8\uC2DD \uC5EC\uD589"});assert.equal(food.purpose,"food");assert.ok(new Set(food.days.flatMap(day=>day.meals.map(item=>item.cuisine))).size>=7);
});

test("meals are realistic categories with alternatives and no availability claims",()=>{
  const plan=buildRealisticItinerary({destinationId:"paris",durationDays:5,mission:"romantic vegetarian Paris trip"});
  for(const meal of plan.days.flatMap(day=>day.meals)){assert.equal(meal.kind,"meal-category");assert.ok(meal.district);assert.ok(meal.relativeCost);assert.ok(meal.alternative);assert.match(meal.dietaryNote,/Vegetarian|Confirm/);assert.doesNotMatch(meal.label,/available|confirmed|booked/i);}
  assert.match(plan.notice,/Verify hours, prices and availability/);assert.match(plan.notice,/No booking has been made/);
});

test("map markers exactly equal final itinerary selections",()=>{
  const plan=buildRealisticItinerary({destinationId:"seoul",durationDays:5,mission:"Seoul culture and food"});const selected=plan.days.flatMap(day=>day.markers);assert.deepEqual(plan.markers,selected);assert.equal(new Set(plan.markers.map(item=>item.id)).size,plan.markers.length);assert.ok(mapMarkersForItinerary(plan,DESTINATION_KNOWLEDGE.seoul.center).every(item=>item.x>=5&&item.x<=95&&item.y>=5&&item.y<=95));
});

test("same mission is deterministic and customization does not create duplicates",()=>{
  const input={destinationId:"barcelona",durationDays:5,mission:"shopping, vegetarian meals, remove nightlife and make it relaxed"};const first=buildRealisticItinerary(input);const second=buildRealisticItinerary(input);assert.deepEqual(first,second);assert.equal(first.purpose,"shopping");assert.equal(first.pace,"relaxed");assert.equal(validateItineraryQuality(first).valid,true);assert.ok(first.days.flatMap(day=>day.meals).every(meal=>/vegetarian|plant-based/.test(meal.cuisine)));
});

test("quality validator rejects duplicates, placeholders and map disagreement",()=>{
  const invalid={purpose:"leisure",days:[{day:1,theme:"x",isArrival:true,activities:[{id:"same"}],meals:[{id:"meal"}],markers:[{id:"pin"}],slots:[{label:"Neighborhood walk"}]},{day:2,theme:"y",isDeparture:true,activities:[{id:"same"}],meals:[{id:"meal"}],markers:[{id:"pin"}],slots:[{label:"Local lunch"}]}],markers:[]};const report=validateItineraryQuality(invalid);assert.equal(report.valid,false);assert.ok(report.issues.includes("duplicate_place_ids"));assert.ok(report.issues.includes("duplicate_meal_ids"));assert.ok(report.issues.includes("generic_placeholder_labels"));assert.ok(report.issues.includes("map_itinerary_disagreement"));
});

test("uncurated destinations are explicitly limited instead of invented",()=>{const plan=buildRealisticItinerary({destinationId:"unknown_city",durationDays:5,mission:"five day trip"});assert.equal(plan.curated,false);assert.equal(plan.days.length,0);assert.match(plan.notice,/not yet curated/);});

test("results renderer consumes the realistic engine and final markers",async()=>{const source=await import("node:fs/promises").then(fs=>fs.readFile(new URL("../js/pages/results-page.js",import.meta.url),"utf8"));assert.match(source,/buildRealisticItinerary/);assert.match(source,/result\.realisticItinerary = realistic/);assert.match(source,/itinerary\?\.curated \? mapMarkersForItinerary/);assert.match(source,/data-itinerary-day/);assert.match(source,/const iconFor = \(slot\)/);assert.match(source,/slot\.mealType === "breakfast"/);});
