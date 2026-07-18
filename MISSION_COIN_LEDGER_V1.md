# Mission Coin Ledger V1

## Append-only transaction record

Every record includes transaction id, wallet id, mission id, account id, optional workspace id, transaction type, amount, before/after balance, reason, subscription tier, creation time/actor, idempotency key and safe metadata.

Supported types are `MONTHLY_ALLOCATION`, `MISSION_COMPLETION_DEBIT`, `PURCHASED_COIN_CREDIT`, `BONUS_CREDIT`, `PROMOTIONAL_CREDIT`, `REFUND_CREDIT`, `ADMIN_ADJUSTMENT`, `EXPIRATION_DEBIT`, `TRANSFER_IN_FUTURE` and `TRANSFER_OUT_FUTURE`. Purchase and transfer types are schema-only.

## Idempotency

Completion uses `mission-completion:{versionHistoryId}`. The wallet rejects an existing key before balance mutation. Monthly allocation uses `monthly:{periodKey}` and credits use their immutable reference. Production must also enforce a unique database index and one locked server transaction; frontend checks are only a convenience.

## Wallets

Personal, family, group, business and enterprise wallets carry owner, optional workspace, source-separated balances, allocation, rollover/expiration policies, reset date, status and immutable history. Spending order comes from central configuration.

## Safety

Authenticated clients have read-only access to ledger and wallet architecture. Direct inserts, updates and deletes are revoked. No card, payment credential, passport, health, child or raw mission content belongs in ledger metadata.
