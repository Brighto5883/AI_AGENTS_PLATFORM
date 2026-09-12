# Production Hardening Progress

## Current pass

The project has been audited across H1-H10. Changes that can be safely made without production credentials,
provider provisioning or a live database have been applied. Remaining blockers are recorded in
`PRODUCTION_DEFERRED.md`.

### H1 Architecture & Ownership

- Application enums moved out of the API schema layer.
- Agent application response moved out of the API layer.
- Feedback service no longer depends on an API request schema.
- Marketplace listing quota ownership moved to marketplace service logic.
- Concrete M-Pesa dependency removed from the donations route.
- Composition root updated for billing, image scanning and transaction dependencies.

### H2 Authentication & Authorization

- Drafts are scoped to users.
- Draft read/review/send/thread operations enforce ownership.
- Invalid mobile sessions clear stored credentials.
- Password reset remains intentionally temporary until a verified delivery mechanism exists.

### H3 Input Validation

- Marketplace and feedback text fields reject whitespace-only values.
- Payment transaction-code input has length/pattern validation.
- Image processor validates declared/detected image format, dimensions, pixels and animation.

### H4 Marketplace Lifecycle

- Public access to inactive/unapproved listings and fulfilled wanted posts is restricted.
- Contact information in marketplace text is scanned regardless of future billing mode.
- Image OCR contact scanning is wired behind `requires_contact_scanning`.
- Marketplace responses now include `contact_unlocked` and hide phone numbers when a future paid gate applies.
- Listing and wanted-post connection transactions are persisted and participant authorization is checked.
- Current launch billing keeps contact unlocked for everyone.

### H5 Transactions & Payments

- Generic payment endpoints exist for future marketplace listing and connection payments.
- Connection transactions become immediately paid with zero fee while billing is disabled.
- Listing-fee and connection-fee paths are wired to the generic payment service when billing is enabled.
- Payment transaction-code recovery delegates to the provider abstraction.
- Real Daraja transaction verification remains deferred until the exact provisioned API is confirmed.

### H6 Images & Storage

- Marketplace image size is configuration-driven.
- Image contact scanning is implemented with local OCR behind a replaceable service boundary.
- Storage cleanup failure is isolated from successful DB deletion and remains tracked for durable retry.

### H7 Error Handling

- Internal exception details are not returned from query-history failures.
- Payment verification returns generic client errors while logging server-side diagnostics.
- Sensitive verification/reset values are not logged.

### H8 Database Integrity & Concurrency

- Ownership foreign keys and active-listing quota logic are in place.
- Live PostgreSQL concurrency and constraint verification remain deferred.

### H9 Rate Limiting & Abuse

- Existing authenticated and WhatsApp rate limits remain active.
- Redis failure behavior remains fail-open by design until a production policy is chosen.

### H10 Observability

- Request-context middleware now assigns/propagates `X-Request-ID` and logs request completion.
- Liveness and database readiness endpoints are available.
- Remaining metrics/alerts and knowledge-pipeline print cleanup remain deferred.

## Commercial configuration

The marketplace is currently free for every user. Future plans are represented generically as:

- subscription / monthly fee / contact available
- pay per connection / connection fee / contact unlocked after payment
- pay per listing / per-item listing fee + free contact after listing payment

See `MARKETPLACE_BILLING.md` for the small set of configuration values to change when charging begins.

## Remaining production configuration

Before enabling production billing, configure `APP_ENV=production`, the Meta `WHATSAPP_APP_SECRET`, and the M-Pesa callback token. M-Pesa transaction-code verification still depends on the exact provisioned Daraja verification API.

## Verification

- Python compilation: PASS.
- Migration compilation: PASS.
- Source-level API-layer dependency audit: PASS.
- Ruff/Pyright and mobile type-checking require the project's installed dependencies and should be run locally.
