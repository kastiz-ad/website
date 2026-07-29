# Kastiz ONE ALPHA-01 — Proactive Mission Intelligence

ALPHA-01 adds Mission Insights as a presentation/recommendation layer on top of the existing Mission Engine, V23 experience layer, and V24 World Intelligence Foundation.

It does not create a new backend architecture, data layer, mission engine, or UI redesign.

## Mission Insight

A Mission Insight is:

- relevant;
- timely;
- actionable;
- truthful;
- optional.

Every insight includes:

- title;
- explanation;
- why the user is seeing it;
- urgency;
- confidence;
- source state;
- whether user action is required.

## Priority rules

Visible insights are capped at 3. Additional insights stay collapsed.

Priority considers:

1. mission-context match;
2. urgency;
3. confidence;
4. V24 source state;
5. user dismissal state.

Insights never block approval or execution preparation.

## Interaction flow

The result page shows one compact section:

```text
Things Worth Knowing
  Insight 1
  Insight 2
  Insight 3
  More optional insights
```

Users can:

- dismiss;
- remind later;
- hide for this mission.

Dismissal is stored locally per mission and is optional. If storage fails, the mission continues normally.

## Founder previews

Preview scenarios are represented through current mission context:

- winter Japan trip;
- family travel;
- solo travel;
- healthcare visit;
- business registration;
- job application.

The same insight component renders across travel, experience, domain, and general result flows.
