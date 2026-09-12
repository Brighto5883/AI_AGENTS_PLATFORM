app/
├── _layout.tsx       ← protects navigation while app is running
├── index.tsx         ← initial authentication routing
│
└── (auth)/
    └── login.tsx

context/
└── AuthContext.tsx   ← source of truth for authentication

services/
├── api.ts            ← detects 401
├── authEvents.ts     ← communicates session expiry
└── tokenService.ts   ← persists/removes JWT


     FLOW
     ## Authentication Flow

The mobile app uses JWT-based authentication with the JWT access token stored persistently by `services/tokenService.ts` and the current authentication state managed in `context/AuthContext.tsx`. On application startup, `AuthProvider` calls `getToken()` to retrieve the stored JWT from `expo-secure-store` on native platforms or `localStorage` on web. If a token exists, `AuthContext` sets it as the current token and `isAuthenticated` becomes `true`; if no token exists, the user is considered unauthenticated. The root `app/_layout.tsx` contains the application's navigation guard, which observes the authentication state and redirects unauthenticated users to `/login`, while authenticated users can access protected routes such as `/home`. When a user logs in, `authService.ts` sends the credentials to the backend's `/auth/jwt/login` endpoint, receives an `access_token`, and the login screen passes that token to `AuthContext.login()`, which saves it through `saveToken()` and updates the in-memory authentication state. All authenticated API requests should go through `services/api.ts` using `apiFetch()`. `apiFetch()` retrieves the stored JWT, adds it to the request as `Authorization: Bearer <token>`, and sends the request to the backend. If the backend responds with HTTP `401 Unauthorized` while a token was attached, this is treated as an expired or invalid session: `apiFetch()` removes the stored token using `removeToken()` and calls `notifyUnauthorized()` from `services/authEvents.ts`. The authentication context listens for this event, sets its token state to `null`, and displays a "Session expired" alert informing the user that they need to log in again. Once `isAuthenticated` becomes `false`, the navigation guard in `_layout.tsx` automatically redirects the user to `/login`. The `index.tsx` route handles the initial authentication decision when the application starts, while `_layout.tsx` handles authentication changes that occur while the user is already inside the application. Therefore, the overall flow is: **login → receive JWT → securely store JWT → AuthContext marks user authenticated → `apiFetch()` attaches JWT to requests → backend validates JWT → normal response if valid, or `401` if expired/invalid → remove JWT → notify AuthContext → mark user unauthenticated → show session-expired message → redirect to login**. The authentication handling is intentionally centralized so individual features such as queries, marketplace listings, wanted posts, and other API calls do not each need their own JWT-expiration logic.
