# KASTIZ ONE ALPHA-12 — Life Timeline & Life Missions

ALPHA-12 adds a Life Timeline layer without changing the homepage, redesigning the UI, or creating a second mission architecture.

## Purpose

ONE should understand that a mission is often part of a larger life journey. A travel mission may connect to passport readiness, insurance, airport transfer, currency, restaurants, photo organization, and expense summary. A business registration mission may connect to a bank account, accounting, payroll, insurance, and hiring.

This layer does not behave like a calendar, to-do list, or CRM. It is a mission-context layer that helps ONE prepare what may naturally come before, after, or beside the current mission.

## Reused systems

- Mission Engine: the current mission remains the source of truth.
- Mission Context Intelligence: provides domain and destination context.
- Personal Mission Memory ALPHA-07: supplies structured user-owned preferences when available.
- Predictive Intelligence ALPHA-06: contributes future suggestions.
- Mission Monitoring ALPHA-11: contributes status-aware follow-up suggestions.
- Multi-Agent Collaboration ALPHA-08: remains available as a coordination source.
- World Intelligence V24: remains the geographic foundation.

## New module

`js/engine/timeline/life-timeline-alpha12.js`

The module produces:

- `currentMission`
- `relationships`
- `goals`
- `futureMissions`
- `missionMap`
- `userControlled` privacy controls
- validation result

## Mission relationships

Supported relationship types:

- Previous
- Next
- Related
- Dependent
- Suggested
- Optional
- Future

Relationships are dynamic. They are generated from mission context, previous missions, memory, predictions, and monitoring state.

## Life stage handling

ALPHA-12 supports life stage labels such as:

- Student
- Young Professional
- Business Founder
- Parent
- Retirement
- Frequent Traveler
- Digital Nomad

ONE must not assume a life stage without supporting evidence. If there is not enough evidence, the layer returns `unknown`.

## Goal system

The layer can support user-defined goals such as:

- Study abroad
- Start company
- Buy house
- Learn Korean
- Travel Europe
- Retire early

Goal progress is expressed through completed and remaining meaningful steps. It does not use arbitrary percentages.

## Privacy and control

The user can:

- pause Life Timeline;
- hide Life Timeline;
- disable future suggestions;
- export the Life Timeline data;
- delete the local Life Timeline state.

The layer is user-owned and does not store raw chat history.

## UI integration

The results page appends one compact `ALPHA-12 · Life Timeline` card after mission monitoring. It uses existing card styling and localization patterns.

## Safety boundary

ALPHA-12 suggests mission continuity only. It never executes, books, pays, submits, signs, contacts, or commits the user to anything.

