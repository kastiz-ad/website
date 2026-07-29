# KASTIZ ONE Real API Integration Report

Milestone: Connect Real APIs and Remove Fake Live Data

## What changed

- Added a provider registry with explicit configured/setup-required status.
- Added server-side Google Geocoding, Places Text Search, and Routes adapters.
- Added Toss Payments test-mode preparation and confirmation helpers.
- Added browser-safe provider registry and payment provider interfaces.
- Added reservation provider contract that fails closed until a real provider exists.
- Updated `.env.example` with Google, Toss, and future provider variables.

## Truth rules enforced

- Missing provider credentials return `setup_required`.
- Provider adapter code alone is not considered a connected provider.
- Provider is connected only after credentials, authentication, successful provider response, normalization, and truthful UI evidence.
- Authentication, quota, network, and provider outages use distinct status categories where possible.
- Google Places hotel results are treated as geographic places, not accommodation inventory.
- Flight, accommodation, and reservation providers remain unavailable until official adapters and credentials are connected.
- Toss test payments reject raw card, CVV, OTP, password, bank, and resident-registration fields.
- Provider status never exposes server keys or Toss secrets.

## Current live status

This repository does not contain credentials. Live verification requires environment variables to be configured in Cloudflare Pages or local dev.

Expected current result without credentials:

- Google Maps browser: setup required
- Google Geocoding: setup required
- Google Places: setup required
- Google Routes: setup required
- Toss Payments test: setup required
- Flights: not connected
- Accommodation inventory: not connected
- Reservation execution: not connected

## Next founder setup

1. Configure Google Cloud restricted keys.
2. Configure Toss Payments test keys.
3. Open `/api/v1/providers/status` and verify only configured/missing state appears.
4. Run test geocode/place/route calls from a signed-in approved test account.
5. Confirm no flight/accommodation/reservation live claims appear until those providers are actually connected.
