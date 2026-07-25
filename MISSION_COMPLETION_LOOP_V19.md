# KASTIZ ONE V19 — Mission Completion Loop

V19 adds the Mission Completion Loop.

A mission is not complete because ONE answered, recommended, prepared, or submitted something. A mission is complete only when the user's intended outcome is verified or the user explicitly closes it.

## Reused architecture

V19 reuses:

- V16 HOS Kernel
- V17 ResolutionPlan
- V18 ActionRequest and Trusted Action Gateway
- Approval-first protection
- Provider-layer status concepts
- Prediction Engine context

## MissionProgress

V19 produces a `MissionProgress` object containing:

- mission ID
- resolution ID
- current state
- completed steps
- pending steps
- blocked steps
- provider statuses
- deadlines
- expected next event
- last verified time
- evidence
- failure reason
- recovery options
- recommended recovery
- user decision requirement
- completion criteria
- completion confidence
- final outcome

## States

Supported mission states include:

- understood
- planning
- waiting_for_information
- solution_prepared
- waiting_for_approval
- approved
- authentication_required
- submitted
- provider_pending
- accepted
- scheduled
- in_progress
- partially_completed
- completed_unverified
- completed_verified
- failed_recoverable
- failed_terminal
- cancelled
- expired

## Recovery principle

When something fails, ONE does not force the user to restart.

It:

1. checks whether retry is safe;
2. avoids duplicate transactions;
3. checks fallback providers;
4. checks alternative solution paths;
5. relaxes only user-approved constraints;
6. asks the minimum necessary decision;
7. continues the mission;
8. never marks complete without evidence.

## Monitoring truth

V19 supports provider-neutral monitoring interfaces:

- webhook-ready status updates
- polling-ready adapters
- manual confirmation
- deadline and expiry checks
- user confirmation
- provider receipt/status ingestion

It does not claim real-time monitoring unless a future provider integration actually supports it.

## Notification rule

ONE should notify only when:

- approval is required;
- a material condition changed;
- the mission is blocked;
- a deadline is near;
- execution succeeded;
- completion needs confirmation.

Every notification includes:

- what changed;
- what ONE already did;
- what decision is required;
- recommended next action.
