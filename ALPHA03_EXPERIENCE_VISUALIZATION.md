# KASTIZ ONE — ALPHA-03 Experience Visualization

## Intent

ALPHA-03 keeps the existing Mission Engine, V23 Experience Layer, V24 World Intelligence, ALPHA-01 Mission Insights, and ALPHA-02 Progressive Refinement intact.

The milestone changes the way a prepared travel journey is presented. The selected journey should feel like a premium travel designer showing the user a trip they can already picture, not a planning document listing internal preparation.

## Updated travel order

1. Journey choices
2. Selected journey hero
3. Experience story
4. Recommended restaurants
5. Recommended places
6. Day preview cards
7. Compact hotel, flight, and transportation direction
8. Collapsed travel preparation
9. Approval preview
10. ALPHA-01 insights and ALPHA-02 refinement

## Visual sections

### Experience story

The visible story answers: “Why does this trip feel exciting?”

It uses the selected V23 journey tone and destination, with short mood tags instead of long planning copy.

### Restaurant preview

Restaurant cards show:

- icon;
- name;
- simple tags;
- source/truth badge.

They do not show fake ratings, review counts, live availability, or reservation status.

### Place preview

Place cards show destination-specific or destination-level recommendations with the same source/truth badge rules.

Sapporo founder previews include Sapporo-specific public examples such as Odori Park, Sapporo Beer Museum, Nijo Market, JR Tower Observatory, Tanukikoji, and Sapporo food stops.

### Day preview

Day cards are intentionally compact. Each day should be readable in under five seconds and help the user imagine the trip flow.

### Collapsed preparation

Lower-priority planning details now live under one collapsed preparation section:

- insurance and risk;
- entry requirements;
- transport details;
- approval checks.

## Truth and safety

ALPHA-03 does not claim that unavailable providers are live. It continues to label estimated, cached public, verified live, placeholder, and unavailable source states.

No booking, payment, provider contact, or submission happens without approval.

## Founder preview states

The four V23 Sapporo journeys now feel visually different:

- Comfortable Sapporo;
- Food-focused Sapporo;
- Value/Budget Sapporo;
- Restful/Family Sapporo.

## Files changed

- `js/pages/results-page.js`
- `results.css`
- `results.html`
- `results.js`
- `tests/experience-visualization-alpha03.test.mjs`
- existing cache-key regression tests

