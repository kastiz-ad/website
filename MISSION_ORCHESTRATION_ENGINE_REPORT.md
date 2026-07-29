# KASTIZ ONE — Mission Orchestration Engine V1

## What changed

This milestone adds a reusable Mission Orchestration Engine so ONE can keep one living mission and update only the affected parts after a natural-language edit.

## Mission architecture

- `MissionState` is the canonical source of truth for the current mission.
- `MissionStore` reads and updates the mission state, records version changes, and keeps internal change history.
- `MissionParser` converts user edits into structured intents such as food, accessibility, budget, hotel-area, and schedule changes.
- `DependencyEngine` maps changed mission fields to affected result sections and provider refresh scopes.
- `MissionOrchestrationEngine` applies the edit, preserves unaffected fields, prepares changed-section highlights, and exposes an undo-ready previous mission snapshot.

## Supported edit examples

- Add matcha ice cream.
- Add sushi.
- Remove museums.
- No seafood.
- Upgrade hotel.
- Lower budget.
- Wheelchair / no stairs.
- Vegetarian.
- Stay near Tokyo Station or Shibuya.
- Spend more time shopping.
- Move Disney to Day 3.

## Performance

Local edits are synchronous and designed to feel instant. The engine produces provider refresh scopes instead of reloading every provider category.

Example: `Add matcha ice cream` refreshes food, changed route segments, timeline, and map pins only. It does not refresh flights, hotels, dates, travelers, or the full mission.

## Tests passed

Regression tests cover canonical mission state, parser intent extraction, targeted dependency updates, founder demo chaining, undo wiring, and results-page integration.

## Known limitations

- Provider refreshes are prepared as scoped requests; live provider execution still depends on the provider adapters and available API keys.
- This does not connect booking, payment, or reservation execution.
- Visual highlights reuse the existing result-section highlight behavior; no UI redesign was added.

## Remaining work before live booking

- Connect scoped provider refreshes to production provider adapters.
- Add provider-return validation for changed sections.
- Keep approval renewal mandatory after material changes.
- Add server-side persistence when accounts and backend storage are production-ready.
