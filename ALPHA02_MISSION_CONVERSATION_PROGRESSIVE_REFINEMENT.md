# KASTIZ ONE ALPHA-02 — Mission Conversation & Progressive Refinement

ALPHA-02 upgrades the results experience from static planning into a lightweight conversation that improves the mission without restarting it.

This is not a new Mission Engine, model, or redesign. It reuses the existing Mission Engine, V23 Experience Layer, V24 World Intelligence Foundation, and ALPHA-01 Mission Insights.

## Progressive Refinement architecture

```
Mission result
  ↓
Existing mission context + memory + V24 world intelligence
  ↓
Progressive Refinement Layer
  ↓
Ranked high-impact questions
  ↓
Mission-scoped answer state
  ↓
Updated recommendation, explanation, insights, and approval state
```

The layer asks only when an answer can materially improve the mission. It never blocks approval and never executes anything.

## Question ranking algorithm

Each candidate question receives:

- priority: `critical`, `high`, `helpful`, or `optional`
- estimated impact
- mission domain
- reason for asking
- expected mission improvement

Visible questions are limited to:

- `critical`
- `high`
- maximum 2 visible questions

Helpful questions remain collapsed. Optional questions are not shown automatically.

## Question lifecycle

1. Created from mission context.
2. Ranked by priority and impact.
3. Asked only if not already known, answered, skipped, delayed, or hidden.
4. User answers with chips, or chooses skip/later/hide.
5. Mission-scoped state is saved.
6. Recommendation update note appears.
7. Question is archived for this mission.

The same question is never asked twice during one mission.

## UI wireframe

```
Help me improve this plan

This recommendation is already good.
Answering only what matters can make it more personal.

[High value] How much walking feels right?
[Less walking] [Normal is fine] [Walking is okay]
Skip · Later · Don't ask again

[High value] Should this trip lean more toward food or sightseeing?
[Food first] [Sightseeing first] [Balanced]
Skip · Later · Don't ask again

Helpful questions (collapsed)
```

## Component list

- Progressive Refinement engine
- Mission-scoped refinement state
- Refinement card renderer
- Chip answer controls
- Skip/later/hide controls
- Update note
- Regression tests

## Files modified

- `js/engine/refinement/progressive-refinement-alpha02.js`
- `js/pages/results-page.js`
- `results.css`
- `results.html`
- `results.js`
- `tests/progressive-refinement-alpha02.test.mjs`
- cache-key assertions in existing regression tests

## Founder previews

The layer supports the requested founder preview domains:

- travel
- family travel
- parents
- luxury
- budget
- healthcare
- education
- business
- career

## Safety

ALPHA-02 does not:

- execute actions
- collect long-form sensitive data
- add another Mission Engine
- duplicate world intelligence
- override explicit user instructions
- block approval
- modify the homepage
