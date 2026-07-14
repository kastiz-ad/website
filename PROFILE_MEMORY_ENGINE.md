# Profile Memory Engine

`js/profile/profile-memory-engine.js` owns all profile reads and writes.

Public functions include `getProfileForMission`, `getSuggestedPrefill`, `getMissingMissionFields`, `confirmProfileValue`, `saveApprovedPreference`, `updatePreference`, `deletePreference`, `clearCategory`, `clearProfile`, and `exportProfileSummary`.

Mission integration reads relevant categories only when memory consent is enabled. Suggested values remain editable. Saving requires an unchecked opt-in and is grouped at the end of the follow-up flow. Sample demo values live in `sessionStorage` only.

Sensitive-looking keys are rejected and every value is stripped of HTML delimiters and length-limited.
