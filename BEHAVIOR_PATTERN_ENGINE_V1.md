# Behavior Pattern Engine V1

## Learning model

Patterns are derived separately from raw mission content. A pattern records account/workspace scope, type, category, confidence, evidence and feedback counts, confirmation/use/expiration timestamps, consent scope, source and status. Only signals marked both approved and consented are eligible.

Confidence is `LOW`, `MEDIUM` or `HIGH`. One observation remains low confidence. Acceptance raises confidence gradually; dismissal lowers it gently. One rejection never becomes a permanent dislike. Unused confidence decays with a configurable half-life and stale patterns can expire.

## Variation

Diversity ranking checks recent categories, cuisines, locations, activities and providers. It penalizes repetition and can reward relevant novelty without mechanically rotating categories. Fatigue control applies cooldowns and suppresses a category after repeated dismissals.

## Controls

Users can enable/disable suggestions, choose Minimal/Balanced/Helpful frequency, control categories and context sources, pause learning, disable cross-mission learning, clear patterns and remove individual patterns through the memory interface.

## Analytics

Hooks report category, type, confidence band, source state and time-to-interaction. Full suggestion text, raw mission content and sensitive attributes are excluded. Success means useful completion and less repeated planning—not addiction or engagement time.
