# Campus Hub Web — Expo / React Native Web Integration

## Purpose

The web application is now implemented **inside `mob_app`** using Expo Web and React Native Web. The mobile application remains the source of truth for routes, screens, components, services, authentication, types, and marketplace behavior.

There is intentionally no second web UI implementation. The same Expo Router application can target Android/iOS and the browser.

## Architecture

```text
AI_AGENTS_PLATFORM/
├── backend/                 # Shared FastAPI API/database integration
├── mob_app/                 # Single client application
│   ├── app/                 # Expo Router routes shared by mobile + web
│   ├── components/          # Shared React Native components
│   ├── context/             # Shared application state
│   ├── services/            # Shared API/auth/business services
│   ├── types/               # Shared TypeScript contracts
│   ├── components/web/      # Web-only navigation shell
│   ├── WEB_APP_GUIDE.md     # This guide
│   └── ...
└── ...
```

## Runtime flow

```text
Browser / Android / iOS
          │
          ▼
      mob_app/app
      Expo Router
          │
          ├── Auth routes
          ├── Home
          ├── Marketplace
          ├── Agents
          └── Account
          │
          ▼
   shared components/services
          │
          ▼
       Railway API
          │
          ▼
    Railway database/storage
```

## Web navigation

On a large browser window (1100px+), `components/web/WebAppShell.tsx` provides a persistent sidebar with:

- Home
- Marketplace
- Browse listings
- What buyers need
- My marketplace
- Available/coming-soon services
- Account
- Logout

On smaller browser widths, the shell changes to a compact top navigation so the application remains usable without forcing a desktop sidebar onto a small screen.

Mobile does **not** use the web shell. Existing mobile navigation/screens remain unchanged.

The shell uses Expo Router links and the same route paths as the mobile app, so browser navigation and deep links stay aligned with the mobile route structure.

## Environment

The client uses the existing Expo environment variable:

```text
EXPO_PUBLIC_BACKEND_URL=https://aiagentsplatform-production.up.railway.app
```

Do not put secrets in the web build. `EXPO_PUBLIC_*` values are public client configuration.

## Run locally

From `mob_app`:

```bash
npm install
npx expo start --web
```

Or:

```bash
npm run web
```

The browser application should open on the local Expo web URL.

## Production web build

From `mob_app`:

```bash
npx expo export --platform web
```

Expo will generate the static web output according to `app.json` (`web.output` is `static`). The generated output can then be deployed to a static hosting provider such as Cloudflare Pages, Vercel, or another static host.

## Important navigation behavior

The application has one route tree. Do not create a second React Router application for the web.

Use Expo Router for navigation:

```tsx
router.push("/marketplace");
router.replace("/login");
```

and route links where appropriate:

```tsx
<Link href="/marketplace" />
```

If a component genuinely needs different platform behavior, prefer platform-specific files such as:

```text
Component.tsx
Component.web.tsx
Component.native.tsx
```

Do not duplicate an entire screen just to make the web layout responsive.

## Git merge strategy

This web integration is deliberately isolated so it is easier to merge into the existing local `mob_app`.

The primary integration changes are:

```text
mob_app/app/(app)/_layout.tsx
mob_app/components/web/WebAppShell.tsx
mob_app/WEB_APP_GUIDE.md
```

The existing mobile routes, services, context, types, and marketplace components are retained as the source of truth.

Recommended merge workflow:

1. Keep a clean local branch/working tree.
2. Back up the current `mob_app` if desired.
3. Copy/merge the changed files above first.
4. Run `npm install` only if `package.json`/lockfile changes are introduced later.
5. Run TypeScript validation.
6. Test Android/iOS behavior.
7. Test `npx expo start --web`.
8. Test deep links and authenticated navigation.
9. Only after verification, commit the integration.

## Validation checklist

```bash
npx tsc --noEmit
npx expo start --web
npx expo export --platform web
```

Then verify:

- login/register
- session restoration
- logout
- home
- marketplace
- listing details
- wanted posts
- create/edit flows
- my marketplace
- account/deletion
- agent routes
- browser back/forward
- direct browser navigation to nested routes
- responsive behavior at desktop, tablet, and narrow browser widths

## Design principle

The goal is **one Campus Hub application with multiple render targets**, not two separate applications that happen to call the same backend.

Mobile and web should share behavior, route structure, business logic, API services, data types, and visual language. Web-specific code should be limited to browser-specific navigation/layout or genuine platform differences.
