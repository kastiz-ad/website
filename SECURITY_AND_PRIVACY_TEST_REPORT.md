# Security and Privacy Test Report

Automated coverage verifies approval hashes, expiration/replay, changed-action rejection, RLS ownership policies, lack of privileged frontend keys, vault fail-closed behavior, passkey challenge constraints, demo-provider labeling, disabled real execution, provider quality, confidence penalties, exact data-release packages, valid demo confirmations, receipt minimization and safe timelines.

Still requires configured staging integration tests: email verification/delivery, password reset delivery, concurrent session expiry, rate limits at the edge, cross-user database tests against a live Supabase instance, production WebAuthn, export/delete completion, and browser network inspection. These cannot be truthfully claimed from a static local environment.
