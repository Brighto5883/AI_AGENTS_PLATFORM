# Campus Hub Website — Review & Architecture Guide

## 1. Purpose

This folder is the web version of the current React Native Campus Hub application. The web app intentionally reuses the backend's existing HTTP API instead of creating a second backend or inventing web-only endpoints.

The implementation is browser-native React + TypeScript/TSX. The mobile app was used as the functional reference; web-specific concerns such as browser routing, localStorage authentication, `<input type="file">`, responsive grids, modals and external contact links are implemented natively for the browser.

## 2. Scope boundary

Only `frontend/` was changed for this website build. `backend/` and `mob_app/` were read for reference and their contents were not changed.

## 3. Application map

### Public
- `/` — public Campus Hub landing page.
- `/login` — email/password login.
- `/register` — account registration with optional phone.
- `/forgot-password` — password reset form.

### Authenticated workspace
- `/home` — service dashboard, marketplace billing notice, support and donation entry points.
- `/marketplace` — marketplace discovery, search, category, price and sort filters.
- `/marketplace/listings/create` — create a listing with up to five image uploads.
- `/marketplace/listings/:id` — listing detail, gallery, contact unlocking and contact actions.
- `/marketplace/listings/:id/edit` — listing metadata editing.
- `/marketplace/wanted` — open wanted posts.
- `/marketplace/wanted/create` — create a wanted post.
- `/marketplace/wanted/:id` — wanted-post detail and contact unlocking.
- `/marketplace/wanted/:id/edit` — wanted-post editing.
- `/marketplace/my-marketplace` — manage listings and wanted posts; mark sold/fulfilled or delete.
- `/agents/road` — Road Agent with optional document upload.
- `/agents/whatsapp` — WhatsApp draft review workflow.
- `/agents/email` — coming-soon placeholder, matching the mobile app's current unimplemented screen.
- `/agents/podcast` — coming-soon placeholder, matching the mobile app's current unimplemented screen.
- `/account` — profile update and account deletion.

## 4. File structure

```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Common.tsx          # reusable buttons, modal, badges, fields and states
│   │   ├── Feedback.tsx        # feedback modal/workflow
│   │   ├── Layout.tsx          # public/app shells and page wrapper
│   │   ├── MarketplaceCards.tsx
│   │   └── PaymentModal.tsx     # M-Pesa marketplace connection flow
│   ├── context/
│   │   └── AuthContext.tsx     # browser auth/session state
│   ├── lib/
│   │   └── api.ts              # authenticated/public fetch wrappers and 401 handling
│   ├── pages/
│   │   ├── Public.tsx
│   │   ├── Auth.tsx
│   │   ├── Home.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Agents.tsx
│   │   └── Account.tsx
│   ├── services/
│   │   └── apiServices.ts      # backend API functions
│   ├── App.tsx                 # router and protected route boundary
│   ├── index.css               # responsive visual system
│   ├── main.tsx
│   └── types.ts                # frontend API/domain types
├── package.json
├── tsconfig*.json
├── vite.config.ts
└── WEBSITE_GUIDE.md
```

## 5. Authentication

The mobile app stores its JWT in platform-specific secure storage. The browser implementation stores the access token in `localStorage` under:

```text
campus_hub_access_token
```

`src/lib/api.ts` adds the token as a Bearer token to authenticated requests. A real `401` clears the token and emits a browser event; `AuthContext` responds by clearing the current user. This mirrors the mobile application's policy that an authenticated API failure invalidates the session, while network failures should not silently log the user out.

The website does not invent a refresh-token flow because the current backend/mobile contract does not expose one in the inspected source.

## 6. Backend integration

`src/services/apiServices.ts` mirrors the current backend routes used by the mobile application. Important groups are:

### Auth
- `POST /auth/jwt/login`
- `POST /auth/register`
- `POST /auth/password-reset`
- `GET/PATCH /users/me`
- `DELETE /account`

### Marketplace
- `GET /marketplace/listings/`
- `GET /marketplace/listings/{id}`
- `GET /marketplace/listings/my-listings`
- `POST /marketplace/listings/`
- `PATCH /marketplace/listings/{id}`
- `PATCH /marketplace/listings/{id}/sold`
- `DELETE /marketplace/listings/{id}`
- `POST /marketplace/listings/{id}/images`
- `DELETE /marketplace/listings/{id}/images/{image_id}`
- `GET /marketplace/wanted/`
- `GET /marketplace/wanted/{id}`
- `GET /marketplace/wanted/my-posts`
- `POST /marketplace/wanted/`
- `PATCH /marketplace/wanted/{id}`
- `PATCH /marketplace/wanted/{id}/fulfilled`
- `DELETE /marketplace/wanted/{id}`
- `GET /marketplace/billing/info`

### Marketplace connections/payments
- `POST /marketplace/transactions/listings/{listing_id}/connect`
- `POST /marketplace/wanted/{wanted_id}/connect`
- `POST /payments/marketplace/transactions/{transaction_id}`
- `GET /payments/{payment_id}`
- `POST /payments/{payment_id}/verify-transaction`

### AI / communication
- `POST /query/` — Road Agent.
- `GET /drafts/?status=pending`
- `GET /drafts/{draft_id}/thread`
- `POST /drafts/{draft_id}/approve`
- `POST /drafts/{draft_id}/reject`
- `POST /drafts/{draft_id}/send`

### Feedback/history/donations
- `POST /feedback`
- `GET /feed/`
- `DELETE /feed/{query_id}`
- `POST /payments/donations`

## 7. Marketplace behavior

The marketplace keeps the mobile app's key behaviors:

1. Browse only approved/active listings returned by the backend.
2. Search title/description.
3. Filter by the existing category values.
4. Filter by minimum/maximum price.
5. Sort by recent, lowest price or highest price.
6. Open a full listing with image gallery.
7. If contact access is locked, create a marketplace connection and start the existing payment flow.
8. After successful payment, reload the listing so the backend's `contact_unlocked` state controls contact access.
9. Contact links open WhatsApp, telephone or SMS through browser/device handlers.
10. Owners can manage listings from My Marketplace.
11. Sold listings remain manageable for the backend-defined retention period and expose `scheduled_deletion_at` where returned.
12. Wanted posts have equivalent create/edit/fulfill/delete management.

## 8. Payment flow

For a locked marketplace contact:

```text
Listing detail
    ↓
Create connection
    ↓
Backend returns Transaction
    ↓
Payment modal asks for Kenyan phone
    ↓
POST /payments/marketplace/transactions/{transaction_id}
    ↓
Payment ID returned
    ↓
Poll GET /payments/{payment_id}
    ↓
successful → reload listing/wanted post
failed/expired → recovery/error UI
poll timeout → transaction-code recovery
```

The frontend deliberately does not decide whether a transaction should be free/paid. That decision remains on the backend.

## 9. Road Agent

The browser uses `FormData` and sends:

```text
query
method=auto
file (optional)
```

to `POST /query/`.

The selected document is not stored by this frontend after the request. The backend remains responsible for its temporary processing lifecycle.

## 10. WhatsApp Agent

The website implements the same review workflow exposed by the current mobile app:

```text
pending draft
   ↓
open conversation thread
   ↓
edit draft
   ↓
approve / reject / send
```

The actual WhatsApp transport and conversation persistence remain backend responsibilities.

## 11. Account deletion

The account page calls the same authenticated backend deletion endpoint used by the mobile app:

```text
DELETE /account
```

On success, the browser clears its local token and redirects to registration. A failed deletion leaves the account session intact and displays the error.

## 12. Responsive design

The website uses three practical layout ranges:

- desktop: multi-column service/listing layouts and split detail views
- tablet: reduced grid columns and stacked agent/account sections where appropriate
- mobile: one-column forms, responsive cards and horizontally scrollable marketplace navigation

The visual direction deliberately keeps the mobile app's restrained black/white/soft-gray aesthetic while using wider desktop compositions.

## 13. Security considerations for review

- Never put backend secrets in `VITE_*` variables. Browser environment variables are public.
- `VITE_BACKEND_URL` is only an API origin, not a secret.
- Do not store payment secrets, provider credentials or JWT signing secrets in the frontend.
- Browser authentication currently uses localStorage because that matches the frontend's simple SPA architecture; a future security-hardening pass can consider an HttpOnly cookie session if the backend contract is changed accordingly.
- The backend must enforce authorization. Frontend route protection is only a UX boundary, not a security boundary.
- The backend must include the production website origin in CORS configuration before a separately hosted website can call it.

## 14. Suggested review order

Review the website in this order:

1. Landing page and branding.
2. Login/register/forgot password.
3. Home/service dashboard.
4. Marketplace discovery.
5. Listing detail/contact unlock.
6. Create listing and wanted post.
7. My Marketplace lifecycle.
8. Road Agent.
9. WhatsApp Agent.
10. Account/profile/deletion.
11. Responsive behavior on phone/tablet/desktop.
12. Error/loading/empty states.

After that review, the main sharpening areas are likely to be brand language, visual hierarchy, exact marketplace UX, richer desktop navigation, accessibility, and deployment-specific configuration.
