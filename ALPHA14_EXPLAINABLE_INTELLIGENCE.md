# KASTIZ ONE ALPHA-14 — Explainable Intelligence

ALPHA-14 adds a unified explanation layer. It does not add another AI model, recommendation engine, assistant, or mission architecture.

## Purpose

Users should understand why ONE recommended, changed, warned, predicted, ranked, or requested approval for something.

The layer explains outcomes. It does not expose chain-of-thought, internal prompts, agent discussions, hidden confidence calculations, or model internals.

## Architecture

The explanation layer consumes outputs from existing systems:

- Mission Engine
- ResolutionPlan
- Provider Trust Network
- Predictive Intelligence
- Mission Monitoring
- Life Timeline
- Approval Engine
- Mission Completion Loop
- World Intelligence Foundation

It produces short user-facing explanations that can be rendered consistently across the product.

## Schema

Each explanation includes:

- `explanationId`
- `type`
- `question`
- `answer`
- `source`
- `evidence`
- `detailLevel`
- `exposesInternalReasoning`
- `localized`

## Explanation types

- Mission Recommendation
- Prediction
- Provider Recommendation
- Mission Update
- Trust Badge
- Mission Change
- Approval Request
- Execution Suggestion
- Warning
- Completion

Future explanation types can be added by configuration.

## Detail controls

Users may choose:

- Minimal
- Standard
- Detailed

Detailed still means concise outcome explanation. It does not reveal private reasoning.

## Tone guidelines

Explanations should be:

- plain language;
- under two sentences when possible;
- specific enough to build trust;
- honest about uncertainty;
- localized in English, Korean, and Spanish;
- screen-reader friendly;
- free of technical implementation details.

## UI integration

The results page adds one `ALPHA-14 · Explainable Intelligence` card. It explains visible mission outputs and provides detail-level controls.

## Safety boundary

The layer never:

- reveals chain-of-thought;
- exposes internal prompts;
- invents evidence;
- claims live integrations that are not connected;
- executes anything;
- weakens approval-first behavior.

