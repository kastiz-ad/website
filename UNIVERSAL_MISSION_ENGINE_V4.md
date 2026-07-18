# Universal Mission Engine V4

## Architecture

UME V4 uses one pipeline for every request:

`Mission → Classifier → Context → Experience → Provider → Live Intelligence → ONE Pick → Preparation → Approval → Receipt`

The implementation is `js/engine/universal-mission-engine-v4.js`. It composes the V3 Experience Engine instead of replacing it. Travel is one configured mission type; education, healthcare, restaurants, accommodation, transport, entertainment, professional services, government, pet care, home services, beauty, sports, shopping, repair, photography, legal, finance, events, childcare, senior care and automotive missions use the same contracts.

## Mission lifecycle

1. Natural language enters `classifyUniversalMission`; category selection is never required.
2. The existing context engine extracts safe, relevant context.
3. V3 builds or supplies the experience structure.
4. Providers normalize through one schema.
5. Live Intelligence marks each condition live, cached, estimated, demo or unavailable.
6. Exactly one `⭐ ONE Pick` is produced, with two alternatives and honest trade-offs.
7. `buildPreparation` chooses a configuration checklist by provider type.
8. Approval remains explicit and execution remains disabled.
9. The existing receipt records the recommended and selected choices neutrally.

## Mission Classifier

Rules cover the currently supported English and Korean intents without forcing category-first UX. Unknown requests become `professional-service`, retain low/unknown confidence, and still proceed through the same preparation pipeline. Future classifier models must return the same normalized result and must not bypass approval.

## Universal provider schema

`normalizeProvider` produces provider ID/type/name, location, hours, reservation method, availability, price, estimated cost, cancellation, Provider Trust, review quality, languages, accessibility, transportation, parking, subway/walking information, contact surfaces, source, freshness, data state and optional category fields. Category-specific attributes remain under `specificFields`; they do not create a second schema or frontend.

## ONE Live Intelligence

The permanent layer covers weather, holidays, hours, closing/last-order times, airports, delays, traffic, roads, transit, crowds, air quality, sunrise/sunset, seasonality and special events. An absent fact is `unavailable`; it is never invented. Estimated and demo states remain explicit. Future live adapters must include source and freshness.

## Transit Intelligence

Walking, subway, bus, taxi, ride hailing, train, airport rail, rental car, bike, scooter and shuttle modes share one ranking model. Evidence, accessibility, transfers, parking, cost and estimates belong to the shared service. V4 never claims live traffic without a live input.

## Preparation Engine and marketplace

Provider definitions supply preparation checklists. Tutors, restaurants, healthcare, salons, lawyers, pet grooming and travel examples use different checklists but the same `buildPreparation` contract, approval state and display surface. A new provider requires metadata and a checklist—not a new page.

## Approval and safety

`executionEnabled` is false. Demo approval shares no data, has no provider handoff and performs no booking, payment or contact. Healthcare retains the logistical-only disclaimer and emergency interception from V3. Branding, homepage and ONE logo are unchanged.

## Future integrations

Authorized provider adapters should normalize records, validate sources, expose freshness, supply live-intelligence evidence, refresh consequential data before approval, and call the existing approval engine. Commercial execution, payments, booking and automated contact remain separate production-readiness projects.

