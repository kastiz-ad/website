import test from "node:test";
import assert from "node:assert/strict";
import { buildRealisticItinerary } from "../js/engine/itinerary/realistic-itinerary-engine.js";
import { RESULT_LOCALES, auditResultMessages, formatResultCount, formatResultCurrency, formatResultDateRange, normalizeResultLocale, resolveResultLocale, resultText } from "../js/i18n/result-localization.js";
import { localeSection } from "../js/i18n/locale-registry.js";

const missions={en:"Plan a 7-day cultural trip to Tokyo.",ko:"도쿄 7일 미식 여행을 계획해줘.",es:"Organiza un viaje romántico de cinco días a París.",fr:"Organise un voyage d’affaires de quatre jours à Séoul."};
const destinations={en:"tokyo",ko:"tokyo",es:"paris",fr:"seoul"};
const days={en:7,ko:7,es:5,fr:4};

test("canonical result locale normalization covers supported variants",()=>{
  assert.equal(normalizeResultLocale("en-US"),"en");assert.equal(normalizeResultLocale("ko-KR"),"ko");assert.equal(normalizeResultLocale("es-419"),"es");assert.equal(normalizeResultLocale("fr-FR"),"fr");assert.equal(normalizeResultLocale("nl-NL"),"en");
});

test("locale resolution follows explicit deterministic priority",()=>{
  assert.equal(resolveResultLocale({selected:"ko",url:"fr",mission:"es",stored:"en",browser:"en-US"}),"ko");
  assert.equal(resolveResultLocale({url:"fr-FR",mission:"es",stored:"en"}),"fr");
  assert.equal(resolveResultLocale({mission:"es-419",stored:"en"}),"es");
  assert.equal(resolveResultLocale({stored:"ko-KR",browser:"fr-FR"}),"ko");
  assert.equal(resolveResultLocale({browser:"fr-FR"}),"fr");
});

test("all four result dictionaries contain every required key",()=>{
  assert.deepEqual(auditResultMessages(),{en:[],ko:[],es:[],fr:[]});
  for(const locale of RESULT_LOCALES){assert.ok(localeSection(locale,"results").missionReady);assert.notEqual(localeSection(locale,"results").makeItReality,"");}
});

for(const locale of RESULT_LOCALES)test(`${locale} itinerary presentation is localized end to end`,()=>{
  const plan=buildRealisticItinerary({destinationId:destinations[locale],durationDays:days[locale],mission:missions[locale],language:locale});
  assert.equal(plan.language,locale);assert.equal(plan.quality.valid,true);assert.equal(plan.days.length,days[locale]);
  assert.ok(plan.days.every(day=>day.dayLabel===resultText(locale,"day",{count:day.day})));
  assert.ok(plan.days.every(day=>day.weatherAlternative===resultText(locale,"weather",{area:day.theme})));
  assert.ok(plan.days.flatMap(day=>day.meals).every(meal=>meal.id&&meal.cuisine));
  const localizedSlots=plan.days.flatMap(day=>day.slots).filter(slot=>["meal-category","work","buffer","transfer"].includes(slot.kind));
  if(locale!=="en")assert.ok(localizedSlots.every(slot=>!/\b(?:Breakfast|Lunch|Dinner|Meeting or focused|Rest and local|Depart via|Arrive via|Buffer)\b/.test(slot.label)));
  assert.deepEqual(plan.markers,plan.days.flatMap(day=>day.markers));
  assert.ok(!JSON.stringify(plan).match(/ï¿½|Ã.|Â.|â€|\uFFFD/));
});

test("proper names remain intact while surrounding presentation changes",()=>{
  const en=buildRealisticItinerary({destinationId:"seoul",durationDays:4,mission:missions.fr,language:"en"});
  const fr=buildRealisticItinerary({destinationId:"seoul",durationDays:4,mission:missions.fr,language:"fr"});
  assert.deepEqual(en.days.flatMap(day=>day.activities.map(item=>item.label)),fr.days.flatMap(day=>day.activities.map(item=>item.label)));
  assert.deepEqual(en.days.flatMap(day=>day.activities.map(item=>item.id)),fr.days.flatMap(day=>day.activities.map(item=>item.id)));
  assert.notEqual(en.days[0].title,fr.days[0].title);
});

test("language switching preserves itinerary selections and map identity",()=>{
  const plans=RESULT_LOCALES.map(language=>buildRealisticItinerary({destinationId:"tokyo",durationDays:7,mission:missions.en,language}));
  const ids=plan=>plan.days.flatMap(day=>day.slots.map(slot=>slot.id));
  const markers=plan=>plan.markers.map(marker=>marker.id);
  for(const plan of plans.slice(1)){assert.deepEqual(ids(plan),ids(plans[0]));assert.deepEqual(markers(plan),markers(plans[0]));}
});

test("date, currency and plural formatting are locale aware",()=>{
  assert.match(formatResultDateRange("2026-08-03","2026-08-09","ko"),/8월/);
  assert.match(formatResultDateRange("2026-08-03","2026-08-09","es"),/ago|agosto/i);
  assert.match(formatResultDateRange("2026-08-03","2026-08-09","fr"),/août/i);
  assert.notEqual(formatResultCurrency(125000,"KRW","en"),formatResultCurrency(125000,"KRW","fr"));
  assert.equal(formatResultCount("days",1,"en"),"1 day");assert.equal(formatResultCount("days",2,"en"),"2 days");
  assert.equal(formatResultCount("travelers",2,"ko"),"2명");assert.match(formatResultCount("nights",2,"fr"),/2 nuits/);
});

test("French results chrome does not silently inherit core English actions",()=>{
  const fr=localeSection("fr","results");assert.equal(fr.customize,"Personnaliser");assert.equal(fr.makeItReality,"Approuver et continuer");assert.equal(fr.weather,"Météo");assert.match(fr.approvalProtection,/Aucune réservation/);
});
