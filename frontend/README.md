# Campus Hub Web Frontend

This is the browser implementation of the current Campus Hub mobile experience. It is written in React + TypeScript + TSX and keeps the same backend API contracts used by the React Native app.

## Quick start

```bash
npm install
npm run dev
```

The Vite development server proxies `/api/*` to `http://localhost:8000` by default. For a deployed frontend, set `VITE_BACKEND_URL` to the public FastAPI origin, for example:

```bash
VITE_BACKEND_URL=https://your-backend.example.com
```

The backend must allow the website origin through its CORS configuration. No backend files are modified by this frontend implementation.

## Validation

```bash
npm run lint
npm run build
```

See `WEBSITE_GUIDE.md` for the full architecture and review guide.
