# Kastiz ONE — Apple-Level Product Review (Phase 1)

Baseline preserved at branch `backup/funding-demo-final-before-apple-review` (`d90fd18`). This review judges only whether ONE feels effortless, calm, useful, and trustworthy.

Scoring: U = estimated user impact, I = investor impact, E = implementation effort, ΔQ/ΔI/ΔB = expected increase in product quality / investor readiness / Public Beta readiness. Impact and effort use Low/Medium/High; deltas are percentage-point estimates. “Implemented” means completed in the Phase 1 frontend commit. “Deferred” means the item requires backend, legal, payment, production API, or representative human testing.

## CRITICAL

|#|Current behavior → friction → proposed improvement|U|I|E|ΔQ/ΔI/ΔB|Status|
|---:|---|---|---|---|---|---|
|1|Departure airport is asked with a Seoul placeholder → repeated thinking → infer a nearby airport from device region and allow Change.|High|High|Low|+3/+2/+2|Implemented|
|2|Location inference could feel invasive → trust loss → explain that only device region is used and precise location is not stored.|High|High|Low|+2/+2/+2|Implemented|
|3|Results previously opened everything → overload → progressive Recommended, Important, Optional, Approval sections.|High|High|Medium|+4/+3/+3|Implemented|
|4|Loading used percentage-like progress → feels simulated → show only meaningful completed preparation steps.|High|High|Low|+3/+3/+2|Implemented|
|5|Approval exposed internal flags → feels unfinished → replace with calm human reassurance.|High|High|Low|+3/+3/+2|Implemented|
|6|Approval language felt consequential before explaining control → anxiety → lead with “Ready to continue?” and state that nothing happens before approval.|High|High|Low|+3/+3/+3|Implemented|
|7|Completion sounded generic → weak emotional reward → end with `ONE'D` and a control reassurance.|High|High|Low|+2/+3/+1|Implemented|
|8|Mission results lacked immediate confirmation of understanding → uncertainty → show “ONE understood your mission” plus prepared items.|High|High|Medium|+3/+3/+2|Implemented|
|9|Users could lose their place → process anxiety → add Mission → Planning → Review → Approval → Execution → Complete timeline.|High|High|Low|+2/+2/+2|Implemented|
|10|Saved preferences were displayed but still felt like questions → repeat work → use “We'll use / Use / Change”.|High|High|Medium|+4/+3/+3|Implemented|
|11|Irreversible actions could occur without approval if guards regress → unacceptable risk → retain mandatory execution guard and disabled payments.|High|High|Medium|+5/+5/+5|Implemented/verified|
|12|Mobile long results required excessive scrolling → abandonment → collapse secondary sections and use one-column cards.|High|High|Medium|+3/+2/+3|Implemented|
|13|Keyboard focus was inconsistent → exclusion and confusion → visible focus for controls and native disclosures.|High|Medium|Low|+2/+1/+2|Implemented|
|14|Motion could be uncomfortable → accessibility failure → global reduced-motion behavior.|High|Medium|Low|+2/+1/+2|Implemented|
|15|Real execution could be mistaken for prototype preparation → trust risk → keep prototype status and approval boundary visible.|High|High|Low|+3/+4/+3|Implemented|

## HIGH

|#|Current behavior → friction → proposed improvement|U|I|E|ΔQ/ΔI/ΔB|Status|
|---:|---|---|---|---|---|---|
|16|Travel follow-up had generic departure wording → unclear why asked → say ONE selected a nearby airport and make the field directly editable.|High|Medium|Low|+2/+1/+2|Implemented|
|17|Mission follow-up labels could sound like a form → software feeling → use conversational step headings.|High|High|Medium|+2/+2/+2|Implemented|
|18|Progress was numeric without context → uncertainty → retain one-decision step count and natural title.|High|Medium|Low|+1/+1/+1|Implemented|
|19|Secondary results competed with the recommendation → hierarchy loss → open only Recommended Plan initially.|High|High|Low|+3/+2/+2|Implemented|
|20|Important information mixed with choices → scanning burden → separate Important Information.|High|High|Low|+2/+2/+2|Implemented|
|21|Customization looked mandatory → decision fatigue → isolate Optional Improvements.|High|Medium|Low|+2/+1/+2|Implemented|
|22|Approval protection appeared among ordinary cards → weak boundary → isolate Approval as the final disclosure.|High|High|Low|+2/+3/+2|Implemented|
|23|Preparation time could be fabricated → trust loss → use honest “under a minute” until backend timing exists.|Medium|High|Low|+1/+2/+1|Implemented|
|24|Loading copy included broad/random phrases → fake feeling → use goal, live information, options, organization, ready.|High|High|Low|+2/+2/+2|Implemented|
|25|Loading animation could repeat unnecessarily → perceived slowness → avoid new decorative or continuous motion.|Medium|Medium|Low|+1/+1/+1|Implemented|
|26|Result disclosures lacked obvious keyboard behavior → accessibility friction → native details/summary controls.|High|Medium|Medium|+2/+1/+2|Implemented|
|27|Korean stage labels could remain English → broken localization → localize every timeline stage.|High|Medium|Low|+1/+1/+2|Implemented|
|28|Saved preference changes required searching below → extra effort → Change jumps to and focuses the relevant field.|High|Medium|Medium|+2/+1/+2|Implemented|
|29|Default airport could be wrong → silent error → keep value editable and never auto-submit it.|High|High|Low|+2/+2/+2|Implemented|
|30|Using GPS would create permission friction → privacy concern → use coarse locale/time-zone mapping instead.|High|High|Low|+2/+3/+2|Implemented|
|31|Homepage needs 30-second comprehension → weak investor story if copy expands → retain single input and no added sections.|High|High|Low|+2/+3/+1|Implemented|
|32|Approval buttons were “Cancel/Approve” → harsher than needed → use Back/Continue.|High|Medium|Low|+2/+1/+1|Implemented|
|33|Completion lacked control reassurance → post-approval anxiety → state “You're always in control.”|High|High|Low|+2/+2/+1|Implemented|
|34|Technical errors risk reaching users → trust loss → retain human fallback messaging and never expose JSON/stack traces.|High|High|Medium|+3/+3/+3|Verified existing behavior|
|35|Provider failure could look like real data → misleading → label demonstration recommendations honestly.|High|High|Medium|+3/+4/+3|Verified existing behavior|
|36|Buttons and cards could feel abrupt → quality loss → keep 200–300ms transitions and reduced-motion escape.|Medium|High|Low|+2/+2/+1|Implemented/existing|
|37|Mobile actions could fall beneath browser chrome → blocked task → retain safe-area and sticky action treatment.|High|Medium|Medium|+2/+1/+2|Verified existing behavior|
|38|Horizontal movement on results undermines control → unstable feeling → constrain grids and page overflow.|High|High|Low|+2/+2/+2|Implemented/existing|
|39|Unnecessary pages/features would dilute the product → complexity → add no new product page or homepage section.|High|High|Low|+2/+3/+1|Implemented|
|40|A real timing metric requires trusted measurement → fake precision risk → defer exact seconds to backend instrumentation.|Medium|Medium|Medium|+1/+1/+1|Deferred: backend|

## MEDIUM

|#|Current behavior → friction → proposed improvement|U|I|E|ΔQ/ΔI/ΔB|Status|
|---:|---|---|---|---|---|---|
|41|Travel questions still total five steps → mild length → combine travelers with budget after human testing.|Medium|Medium|Medium|+1/+1/+1|Public Beta test|
|42|Tutor intake uses one dense card → category inconsistency → split only if completion data shows hesitation.|Medium|Low|Medium|+1/0/+1|Public Beta test|
|43|Shopping intake asks several fields → effort → prefill country and infer use case where safe.|Medium|Medium|Medium|+1/+1/+1|Remaining|
|44|Business intake cannot infer legal structure → repeated research → recommend a shortlist after jurisdiction backend exists.|Medium|High|High|+2/+2/+1|Deferred: legal/backend|
|45|Language exchange safety checklist appears late → missed value → surface one quiet safety reminder in results.|Medium|Medium|Low|+1/+1/+1|Remaining|
|46|Passport validity reminder is not proactive → missed wow moment → offer a non-blocking reminder for international travel.|Medium|High|Medium|+2/+2/+1|Remaining|
|47|Moving missions need proactive bank/phone/tax suggestions → incomplete feeling → group them under Important Information.|Medium|High|Medium|+2/+2/+1|Remaining|
|48|Business missions need bank/tax/accounting/domain suggestions → incomplete operator feeling → preselect a concise checklist.|Medium|High|Medium|+2/+2/+1|Remaining|
|49|No representative hesitation recordings → blind spots → run observed tests with six user profiles.|High|High|Medium|+3/+3/+3|Public Beta research|
|50|Older users may miss icon-only controls → discoverability → confirm accessible names and add text only where testing fails.|Medium|Medium|Low|+1/+1/+1|Audit remaining|
|51|Result section names use numbers and titles → possible duplication → test numbers versus titles only.|Low|Low|Low|+1/0/0|A/B test|
|52|Long recommendation reasons may slow scanning → reading effort → cap to one decisive sentence.|Medium|Medium|Medium|+1/+1/+1|Remaining|
|53|Pricing ranges may lack confidence cue → uncertainty → add concise “estimate/live” labels consistently.|Medium|High|Low|+1/+2/+1|Remaining|
|54|Hotel nightly and total price can be confused → calculation effort → always show both when dates exist.|Medium|Medium|Medium|+2/+1/+1|Remaining|
|55|Round-trip price wording varies → doubt → normalize “round-trip total”.|Medium|Medium|Low|+1/+1/+1|Remaining|
|56|Restaurant cards can carry too much copy → scanning effort → name, rating, price level, distance only.|Medium|Medium|Medium|+1/+1/+1|Remaining|
|57|Weather detail may be too dense → reading effort → keep one line per day with consistent ordering.|Medium|Low|Low|+1/0/+1|Existing; audit|
|58|Exchange-rate details can dominate → hierarchy issue → show total conversion first, rate second.|Medium|Medium|Low|+1/+1/+1|Remaining|
|59|Visa upload is consequential → anxiety → explain why each document is needed at action time.|Medium|High|Medium|+2/+2/+2|Remaining/legal review|
|60|Additional services input is open-ended → thinking burden → offer context-specific examples, not more controls.|Medium|Medium|Low|+1/+1/+1|Remaining|
|61|Modify choices can be long → option fatigue → rank top four and hide the rest under More.|Medium|Medium|Medium|+2/+1/+1|Remaining|
|62|Selecting an alternative changes rationale but transition is subtle → uncertainty → briefly announce the updated reason.|Medium|Medium|Low|+1/+1/+1|Remaining|
|63|Budget recalculation has no confirmation → doubt → animate only the changed total and announce it.|Medium|High|Medium|+2/+2/+2|Remaining|
|64|Back navigation can restore stale results → confusion → validate mission/result revision on pageshow.|Medium|Medium|Medium|+2/+1/+2|Remaining|
|65|Refresh can repeat loading visuals → delay → use cached prepared results when safe.|Medium|Medium|Medium|+2/+1/+2|Remaining|
|66|Provider calls may overlap duplicate requests → performance risk → extend request-key cache across same mission session.|Medium|High|Medium|+2/+2/+2|Remaining|
|67|Location mapping covers limited time zones → wrong airport → expand mappings based on usage, never precise GPS by default.|Medium|Medium|Low|+1/+1/+1|Remaining|
|68|Multi-airport regions need choice → wrong default → show nearest major airports after city-level consent.|Medium|Medium|High|+2/+1/+1|Deferred: location API|
|69|Saved airport may conflict with travel origin → silent mismatch → prioritize explicit mission origin over memory and device region.|High|Medium|Medium|+2/+1/+2|Remaining|
|70|Consent choice lacks contextual reminder at analytics test time → ambiguity → link to privacy choices from Settings only.|Low|Medium|Low|+1/+1/+1|Existing|
|71|Profile memory is device-only → surprise across devices → repeat “this device” at save point.|Medium|Medium|Low|+1/+1/+1|Existing; audit|
|72|Korean line breaks can split short words → visual roughness → apply language-aware wrapping to compact option labels.|Medium|Medium|Low|+1/+1/+1|Remaining|
|73|Landscape phone density remains fragile → task obstruction → run dedicated 667×375 and 844×390 checks.|High|Medium|Medium|+2/+1/+2|Public Beta test|
|74|Large text accessibility can overflow controls → exclusion → test 200% zoom and dynamic-type equivalents.|High|Medium|Medium|+2/+1/+2|Public Beta test|
|75|Screen-reader announcement order after approval may be unclear → completion missed → move focus to completion heading.|Medium|Medium|Low|+1/+1/+1|Remaining|

## LOW

|#|Current behavior → friction → proposed improvement|U|I|E|ΔQ/ΔI/ΔB|Status|
|---:|---|---|---|---|---|---|
|76|Timeline arrows disappear on mobile → less sequence clarity → test dots versus compact labels.|Low|Low|Low|+0.5/0/+0.5|Later|
|77|Disclosure plus/minus is typographic → minor inconsistency → consider one existing icon style.|Low|Low|Low|+0.5/+0.5/0|Later|
|78|Mission summary chips may wrap unevenly → visual noise → balance chip labels after real-content audit.|Low|Medium|Low|+0.5/+0.5/0|Later|
|79|“Under a minute” may become inaccurate for slow networks → trust edge case → switch to “Prepared for review” if >60s.|Low|Medium|Low|+0.5/+1/+0.5|Later|
|80|Long airport names can wrap → card height variance → allow two calm lines without truncation.|Low|Low|Low|+0.5/0/+0.5|Later|
|81|Some titles retain title case → tone inconsistency → sentence-case audit.|Low|Medium|Low|+0.5/+0.5/+0.5|Later|
|82|Some ellipses vary → microcopy inconsistency → normalize to one character/style.|Low|Low|Low|+0.25/0/0|Later|
|83|Some prototype labels repeat → visual noise → keep one label per section.|Low|Medium|Low|+0.5/+0.5/0|Later|
|84|Footer competes on very short landscape screens → density → reduce only in landscape breakpoint.|Low|Low|Low|+0.5/0/+0.5|Later|
|85|Header logo may shift by a pixel across fonts → polish → visual regression snapshots.|Low|Medium|Low|+0.25/+0.5/0|Later|
|86|Theme transition duration varies → subtle inconsistency → standardize tokens.|Low|Medium|Low|+0.5/+0.5/0|Later|
|87|Focus ring color uses computed mixing → older-browser variance → add explicit fallback.|Low|Low|Low|+0.5/0/+0.5|Later|
|88|Native date picker appearance varies → perceived inconsistency → accept platform-native behavior unless usability fails.|Low|Low|High|0/0/0|Intentionally unchanged|
|89|Native select arrow spacing varies → minor visual issue → audit only on supported browsers.|Low|Low|Low|+0.25/0/+0.25|Later|
|90|Completion logo spacing can vary by viewport → minor brand polish → snapshot at key widths.|Low|Medium|Low|+0.25/+0.5/0|Later|
|91|Return-home copy may be longer in Korean → minor density → use shorter equivalent after language review.|Low|Low|Low|+0.25/0/+0.25|Later|
|92|Empty additional-services list has no example after typing → minor guidance → retain placeholder; avoid adding UI.|Low|Low|Low|0/0/0|Intentionally unchanged|
|93|Location footer may show unknown region → mild confusion → say “Location not set” rather than imply failure.|Low|Low|Low|+0.25/0/+0.25|Later|
|94|Some shadows differ across cards → minor visual inconsistency → consolidate shadow tokens.|Low|Medium|Low|+0.5/+0.5/0|Later|
|95|Borders differ slightly between modal families → polish → consolidate border tokens.|Low|Medium|Low|+0.5/+0.5/0|Later|
|96|Loading step dots are generic → could be checks when complete → add semantic check without extra animation.|Low|Medium|Low|+0.5/+0.5/+0.25|Later|
|97|Results disclosure state is not remembered on refresh → minor repeat effort → session-only state if testing justifies it.|Low|Low|Medium|+0.5/0/+0.5|Later|
|98|No print-friendly result view → niche friction → defer until user evidence exists.|Low|Low|Medium|+0.25/0/0|Later|
|99|No shareable approval summary → niche collaboration → defer until privacy/backend model exists.|Low|Medium|High|+0.5/+0.5/0|Deferred: privacy/backend|
|100|No celebratory sound/haptic → could distract → do not add without opt-in and research.|Low|Low|Medium|0/0/0|Intentionally excluded|

## Phase 1 conclusion

The feasible Critical and High frontend improvements are implemented or preserved. Items requiring authenticated storage, production providers, precise location, payment, legal interpretation, or representative human research remain explicitly deferred. The recommended next action is preview-only founder testing against the preserved baseline before any merge decision.
