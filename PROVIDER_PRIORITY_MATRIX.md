# Provider Priority Matrix

Status verified against official documentation on 2026-07-16. “Placeholder” means no external call and no implied partnership.

| Provider | Domain | Access | Connector | Capabilities | Default role |
|---|---|---|---|---|---|
| Open-Meteo | Weather | Free non-commercial evaluation; commercial plan for production | Live | Forecast | Primary prototype weather |
| OpenStreetMap Nominatim | Maps | Public low-volume policy | Live | Geocode/place search | Primary prototype geocoder; cache/1 rps |
| Frankfurter | Currency | Public | Live | Exchange rate | Primary prototype currency |
| REST Countries | Country | Public | Live | Country facts | Primary prototype country |
| Wikipedia | Knowledge | Public | Live | Destination summary | Secondary prototype context |
| Booking.com | Accommodation | Managed Affiliate contract, key, affiliate ID | Placeholder | Search, availability, reserve | Future primary accommodation |
| Agoda | Accommodation | Partner/account-manager access | Placeholder | Content, availability, reserve | Future fallback |
| Hotels.com / Expedia Rapid | Accommodation | Partner application, credentials, launch review | Placeholder | Search, availability, reserve/cancel | Future fallback |
| Skyscanner | Flights | Partner API key | Placeholder | Live flight search/compare | Future primary flight comparison |
| Google Flights | Flights | Invite-only partner onboarding; no consumer search API | Placeholder | Partner flight metasearch | Future enterprise option |
| Google Places | Restaurants/places | API key and billing | Placeholder | Text/nearby/details | Future keyed place search |
| Catchtable | Restaurants | No public developer API verified | Placeholder | Search/availability/reserve | Partnership candidate |
| Interpark | Events | No public ticketing API verified | Placeholder | Event search/purchase | Partnership candidate |
| YES24 | Events | No public ticketing API verified | Placeholder | Event search/purchase | Partnership candidate |
| Melon Ticket | Events | No public ticketing API verified | Placeholder | Event search/purchase | Partnership candidate |
| CGV | Movies | No public booking API verified | Placeholder | Showtimes/reserve/purchase | Partnership candidate |
| Lotte Cinema | Movies | No public booking API verified | Placeholder | Showtimes/reserve/purchase | Partnership candidate |
| Megabox | Movies | No public booking API verified | Placeholder | Showtimes/reserve/purchase | Partnership candidate |
| Coupang | Shopping | Seller API requires seller/business credentials; not consumer search | Placeholder | Future product commerce | Partnership required |
| Naver Shopping Search | Shopping | App registration, client ID/secret; 25,000/day documented | Key placeholder | Product search/price comparison | First Korean shopping API candidate |
| Soomgo | Services | No public developer API verified | Placeholder | Services/tutors | Partnership candidate |
| Online tutoring | Education | Provider to be selected | Simulated placeholder | Tutor search/compare | Fallback prototype |

## Default fallback examples

- Accommodation: Booking.com → Agoda → Hotels.com/Rapid → prototype recommendation.
- Flights: Skyscanner → Google Flights partner option → prototype estimate.
- Restaurants: Catchtable → Google Places → OpenStreetMap place context → prototype recommendation.
- Shopping Korea: Naver Shopping Search → Coupang partnership → prototype comparison.
- Tutors Korea: Soomgo partnership → online tutoring connector → prototype shortlist.

Provider preference never bypasses terms, consent, approval, country eligibility, or health status.
