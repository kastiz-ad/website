# KASTIZ ONE — AI Decision Engine V1

## What changed

This milestone adds a travel decision layer that reviews the prepared mission and proposes useful improvements without automatically changing confirmed user choices.

## Decision Engine architecture

- `analyzeMission` reads the current mission, destination, dates, restaurants, places, hotel data, mobility context, and mission history.
- `calculateMissionHealth` computes internal quality signals for routing, pacing, schedule readiness, destination fit, food coverage, indoor backup, and accessibility risk.
- `generateDecisionRecommendations` creates meaningful suggestions only when the mission data supports them.
- `createAIDecisionLayer` returns at most three visible decision cards.
- Decision-card actions are approval-first:
  - Accept applies the suggestion through the existing Mission Orchestration Engine.
  - Dismiss records a rejection signal so repeated unwanted ideas become quieter.
  - Ask ONE why reveals short evidence labels.

## Recommendation examples

- Move Disney away from the busiest day.
- Add a matcha dessert stop between activities.
- Use easier transfers and fewer stairs.
- Compare staying near a major transit hub.
- Prepare one indoor backup for bad weather.
- Place popular meals at better times.

## Performance

The decision layer runs locally against the current mission object and uses only lightweight analysis. It does not perform heavy provider searches by itself. Provider refresh remains scoped through Mission Orchestration after the user accepts a suggestion.

## Future improvements

- Connect route-duration and walking-distance calculations to live route adapter outputs.
- Use provider opening-hour data when available.
- Add richer preference learning across signed-in accounts after production memory is ready.
- Add server-side audit trails for accepted and dismissed decision recommendations.

## Safety and truthfulness

- ONE does not execute, book, pay, reserve, or contact providers.
- ONE does not change confirmed choices automatically.
- Exact time, cost, wait, or distance numbers are not invented.
- Live values are deferred to provider verification before approval.
