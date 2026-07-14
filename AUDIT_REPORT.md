# Kastiz ONE funding-demo audit

Date: 2026-07-15 · Branch: `funding-demo-final`

| Route/file | Problem | User/demo impact | Severity | Action | Result |
|---|---|---|---|---|---|
| Homepage mission flow | Legacy classification remained connected after modular classifier was introduced | Tutor/childcare/language-exchange prompts could receive irrelevant flows | Critical | Connected `classifyMission()` to mission creation and submission; added category follow-ups | Exact prompt classification covered by tests |
| Homepage | Every submission opened the travel date dialog | Non-travel demos felt incorrect | High | Added category-specific follow-up modal; date dialog follows only travel | Distinct questions for 8 categories |
| Providers | Timeout only; inconsistent status shape and no cache/retry timestamp | Blank or brittle demo under API failure | High | Added retry, TTL cache, `retrievedAt`, normalized live/fallback result contract | Structured fallback always returned |
| Pricing | Payment-disabled statement was less explicit than approved copy | Could imply checkout readiness | High | Added exact planned-pricing/payment-disabled copy; retained `paymentsEnabled=false` | No checkout enabled |
| Login | “Coming soon” dead end | Weak demand capture | Medium | Added gradual-release explanation and early-access/invitation/support actions; retained `authenticationEnabled=false` | No fake account creation |
| Homepage copy | Product and approval explanation was not visible near mission input | Trust model unclear | High | Added approved bilingual explanation and trust statement | Visible in all themes |
| Privacy content | Personal Gmail was publicly exposed | Privacy and professionalism risk | High | Replaced with `privacy@kastiz.com` | No personal Gmail in policy copy |
| SEO | Generic title and incomplete social/canonical metadata | Poor discoverability/share preview | Medium | Added canonical, hreflang, OG, X card and accurate SoftwareApplication JSON-LD | Static markup present |
| Hosting | No explicit security/cache headers, sitemap, robots or 404 | Security/performance/discovery gaps | Medium | Added `_headers`, `sitemap.xml`, `robots.txt`, `404.html` | Ready for compatible static host |
| Forms | No connected submission backend | Users could assume transmission | High | Existing browser-only storage disclosure retained; no success claim added | Backend remains launch blocker |
| Accessibility | Logo duplicated visible fragments | Repetitive screen-reader output risk | Medium | Existing brand label retained once; visual fragments remain hidden | Static markup reviewed |
| Demo continuity | No offline fallback | Live failure could stop presentation | High | Added self-contained offline demo and failure script | Opens without network |

## Route audit

Homepage, loading, results, settings, pricing/upgrade, login, early access, content/business, help, and all listed policy/disclaimer routes were included in static link/import inspection. No operator/admin route is present. Payments and authentication are feature-disabled. Public provider results are labeled live only after a successful response; other results remain prototype or fallback demonstration content.

## Remaining material issues

- There is no secure form/backend delivery, real identity system, payment processor, booking provider, or human-operations console.
- Production API behavior, real-browser accessibility, and the complete device matrix require final staging validation after deployment.
- Policy text is an operational draft and requires qualified Korean legal review before commercial launch.
