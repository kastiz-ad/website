# Suggestion System V1

## Generation and priority

V1 supports unfinished tasks, upcoming preparation, family/work/travel/dining/schedule/weather/traffic/reminder/follow-up/new-experience/healthcare/education/community/return-home and mission-continuation suggestions. Priority begins with safety and time-sensitive preparation, then coordination and assistance, and ends with inspiration. Sponsored placement does not exist.

Every suggestion contains id, type, bilingual title and prompt, short reason, confidence, source context/state, participants, related mission, safe action, expiration, privacy classification, status and creation time.

## Homepage behavior

At most one compact, neutral row appears beneath existing controls. It has no banner styling, carousel, flashing, automatic expansion or automatic rotation. Accept starts preparation. Dismiss records light feedback and may load one other eligible suggestion once. Ignore has no penalty and never blocks search. If nothing useful exists, the row disappears.

## Explanation and language

“Why this?” gives a short reason without exposing a behavioral profile or another member’s private details. English and Korean copy stays brief and avoids claims such as “we watched” or “we know where you go.”

## States

The architecture supports `LOADING`, `AVAILABLE`, `ACCEPTED`, `DISMISSED`, `EXPIRED`, `NO_SUGGESTION` and `ERROR`. Loading failure hides the row cleanly.
