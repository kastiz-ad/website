# KASTIZ ONE ALPHA-04 — Living Mission

## Purpose

ALPHA-04 turns the result page into a persistent Mission Workspace. The page is no longer treated as a static “finished answer.” It shows the current mission state, why something changed, what ONE is still waiting for, and what the user can safely approve next.

This is not a new AI engine and not a redesign. It reuses the existing Mission Engine, V23 experience layer, V24 World Intelligence, ALPHA-01 insights, ALPHA-02 refinement, and ALPHA-03 visualization.

## Architecture

```text
Mission Engine result
        │
        ├─ V23 Experience Layer
        ├─ V24 World Intelligence
        ├─ ALPHA-01 Insights
        ├─ ALPHA-02 Refinement
        ├─ ALPHA-03 Visualization
        │
        ▼
ALPHA-04 Living Mission Workspace
        │
        ├─ Compact mission summary
        ├─ Single mission status
        ├─ Progress stages
        ├─ Remaining task list
        ├─ Contextual notifications
        ├─ Mission history
        ├─ Approval history
        └─ Section-level update markers
```

## Lifecycle

```text
created
  ↓
understanding
  ↓
preparing
  ↓
refining
  ↓
searching
  ↓
awaiting approval
  ↓
ready
  ↓
completed / resumable
```

The workspace never marks booking, payment, submission, or provider contact as approved unless a separate explicit approval scope exists.

## Wireframe

```text
┌──────────────────────────────────────────────┐
│ ALPHA-04 · Living Mission                    │
│ Mission Workspace                            │
│ ONE keeps this mission alive as things change│
├─────────┬─────────┬─────────┬─────────┬──────┤
│ Mission │ Status  │Progress │Updated  │Next  │
├──────────────────────────────────────────────┤
│ Understanding · Preparing · Refining · Ready │
├─────────────────────┬────────────────────────┤
│ Remaining tasks     │ Mission updates         │
├─────────────────────┴────────────────────────┤
│ Mission history ▾                             │
│ Approval history ▾                            │
└──────────────────────────────────────────────┘

Existing result sections below keep their current UI.
Only affected sections receive “Updated” markers.
```

## Update flow

1. A refinement, provider state, weather state, date change, or approval event happens.
2. ALPHA-04 creates a structured workspace state.
3. Only affected sections are marked as recently updated.
4. The compact summary updates the status, progress, last updated time, and next action.
5. History records the change with a reason.
6. Notifications appear only when the user needs useful context.

Founder preview scenarios:

- `alpha04Scenario=budget-changed`
- `alpha04Scenario=parents-added`
- `alpha04Scenario=travel-dates-updated`
- `alpha04Scenario=weather-changed`
- `alpha04Scenario=provider-unavailable`
- `alpha04Scenario=approval-completed`
- `alpha04Scenario=mission-resumed-next-day`

## History model

```js
{
  id: "weather-changed",
  type: "weather_update",
  label: "Weather changed; indoor alternatives and timing were updated.",
  at: "ISO timestamp",
  sections: ["journey", "places", "timeline", "insights"]
}
```

Approval history is separate:

```js
{
  id: "approval-demo",
  scope: "search_preparation",
  label: "Approved preparation and comparison. Booking/payment still not approved.",
  at: "ISO timestamp",
  executionApproved: false
}
```

## Files modified

- `js/engine/workspace/living-mission-alpha04.js`
- `js/pages/results-page.js`
- `results.css`
- `results.html`
- `results.js`
- `tests/living-mission-alpha04.test.mjs`
- cache-version expectations in existing regression tests

## Safety boundaries

- Homepage unchanged.
- Mission engine architecture unchanged.
- No booking, payment, provider contact, or submission added.
- Device-local resume state only stores UI state such as scroll position and opened workspace panels.
- Existing untracked preview images are intentionally not part of this milestone.
