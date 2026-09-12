# Deferred Production Work

This file records production-hardening items intentionally left unresolved because they require
external services, production credentials/provisioning, product decisions, or a later phase.

## H2 Authentication & Authorization

- Password reset currently changes a password without proving email ownership. Keep temporarily for the free/early stage; replace with a verified email reset-link/token flow when email delivery is provisioned.
- Add a complete account-email verification policy if the product requires verified email ownership.
- Review token lifetime/refresh-token strategy before production scale.

## H4 Marketplace Lifecycle / Contact Gating

- Contact gating is now represented in marketplace responses through `contact_unlocked`. During the free-launch period it is always unlocked. When billing is enabled, subscription owners remain publicly contactable, and pay-per-listing sellers become publicly contactable once their listing fee is paid; pay-per-connection requires a paid connection transaction.
- Complete the mobile paid-connection UX: initiate payment, monitor callback/status, fall back to transaction-code recovery, then refresh the protected contact.
- Wanted-post connection needs the equivalent complete mobile payment/contact flow.
- Add a product rule for whether one user can pay once and reuse a connection or whether every new connection requires a separate fee.

## H5 Transactions & Payments

- Implement real M-Pesa transaction-code verification against the exact provisioned Safaricom/Daraja API.
- Configure `MPESA_CALLBACK_TOKEN` and include it in the provisioned callback URL before production; validate the callback flow against Safaricom.
- Add production M-Pesa credentials to the appropriate environment variables; never commit them.
- Confirm exact Till/Short Code STK configuration with the provisioned Daraja product.
- Independently validate callback payer/account, amount, reference and receipt where supported by the provider.
- Add durable/idempotent payment-success processing (outbox/event or equivalent).
- Add payment reconciliation, timeout recovery and an operational retry process.
- Complete subscription payment lifecycle: subscription record, renewal, expiry, cancellation, grace period and plan changes.

## H6 Images & Storage

- OCR-based image contact scanning is now wired behind the marketplace contact-scanning capability. Evaluate false positives/negatives with real marketplace images and add a stronger vision/OCR provider if needed.
- Add durable cleanup/retry for storage objects when a database transaction succeeds but object deletion fails.
- Decide and implement production object-storage policy (R2/private bucket/presigned URLs) rather than relying on local static media.

## H8 Database Integrity & Concurrency

- Add concurrency-safe subscription quota enforcement so simultaneous listing creations cannot exceed quota.
- Add database-level protection against duplicate active marketplace connection transactions.
- Verify foreign-key delete behavior and indexes against the live PostgreSQL schema.
- Add database-level state-transition constraints where appropriate.

## H9 Rate Limiting & Abuse

- Decide whether security-sensitive endpoints should fail closed when Redis is unavailable.
- Add IP/device-level limits for unauthenticated endpoints and webhook abuse protection.
- Meta WhatsApp webhook signature verification is wired and requires `WHATSAPP_APP_SECRET` in production; validate with a real Meta webhook before launch.
- Review rate-limit policy by endpoint/action rather than one global authenticated limit.

## H10 Observability

- Add request IDs/correlation IDs to centralized logging and propagate them to downstream services where useful.
- Add metrics/alerts for authentication failures, payment failures, webhook failures, queue failures, storage cleanup failures, and LLM/provider errors.
- Add infrastructure-specific readiness checks and monitoring thresholds.
- Replace remaining development `print()` calls in knowledge/indexing utilities with structured logging.

## Final Production Audit

- Run full integration tests against a real PostgreSQL/Redis environment.
- Run mobile Android/iOS release builds and end-to-end flows.
- Run migration upgrade/downgrade validation against a disposable database.
- Perform dependency/security scanning and secret scanning before release.
