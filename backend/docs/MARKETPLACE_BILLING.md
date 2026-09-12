# Marketplace Billing Configuration

The marketplace uses one billing abstraction with three future commercial modes:

1. **Subscription** — monthly fee; the user's marketplace contact is available to other users.
2. **Pay per connection** — listings do not carry a listing fee; the user pays to unlock contact for a particular connection.
3. **Pay per listing** — the seller pays a configured fee per posted item. Once that listing is paid for, its contact is available to marketplace users without an additional connection fee.

## Current launch state

`MARKETPLACE_BILLING_ENABLED=false` keeps every marketplace user on the free launch experience.
The backend still evaluates the configured future billing mode so the enforcement switch can be
turned on without rewriting marketplace flows.

## Main settings to change later

```env
MARKETPLACE_BILLING_ENABLED=true
MARKETPLACE_DEFAULT_BILLING_MODE=connection_fee
MARKETPLACE_CURRENCY=KES
MARKETPLACE_SUBSCRIPTION_MONTHLY_FEE=549.00
MARKETPLACE_CONNECTION_FEE=25.00
MARKETPLACE_LISTING_FEE_PER_ITEM=25.00
```

The exact amounts are placeholders and should be changed before charging users.

The application exposes `/marketplace/billing/info` so the mobile client can display the planned
pricing and current launch status without hard-coding commercial terms into the UI.

## Future plan selection

The current implementation intentionally does not allow users to switch billing plans yet. That
requires subscription lifecycle/payment handling, plan-change rules, and an administrative policy.
Those are tracked in `PRODUCTION_DEFERRED.md`.


## Contact access rule

- Free launch: all contacts are available.
- Subscription: contacts are available to marketplace users while the subscription is active.
- Pay per connection: contact is unlocked only after the connection fee is successfully paid.
- Pay per listing: the seller pays the per-item listing fee; once the listing is paid/approved, its contact is available to marketplace users without an additional connection fee.
- Contact information remains prohibited in marketplace text/images; image OCR scanning is enabled for paid listing mode and can be enabled for other modes independently.
