# 12 — Web Frontend Implementation (Chapter 4 source)

**Location:** `d:\Suraksha - Web App\frontend`. **Stack:** React 19 · Vite 6 ·
TypeScript · Tailwind CSS 4 · Zustand · TanStack Query 5 · React Router 7 ·
React Leaflet + Leaflet.heat · ApexCharts / Recharts · Socket.IO client · i18next.
**Purpose:** the **DMC command dashboard** (and small public portals).

## 12.1 Routing & role-based access

`src/App.tsx` defines the routes; a `ProtectedRoute` / role wrapper gates them.

| Route | Page | Allowed roles |
|---|---|---|
| `/` | `DashboardPage` (officer/admin) or redirect | ADMIN, DMC_OFFICER |
| `/citizen-home` | `CitizenDashboardPage` | CITIZEN |
| `/hospital`, `/hospital/referrals`, `/hospital/capacity` | Hospital pages | HOSPITAL_STAFF |
| `/incidents` | `IncidentsPage` | officer+ |
| `/suraksha-alerts` | `AlertsPage` | admin (create), all (view) |
| `/map` | `MapPage` (live Leaflet) | officer+ |
| `/water-monitor`, `/river-mappings` | water pages | officer+ |
| `/ai-research` | `AIResearchPage` (model confidence / uncertainty explorer) | officer+ |
| `/camps`, `/tokens`, `/resources`, `/donations` | relief pages | officer+ |
| `/help-requests`, `/tasks`, `/volunteers` | coordination pages | officer+ |
| `/missing-persons`, `/damage-assessment`, `/support`, `/family-safety` | support pages | mixed |
| `/users` | `UserManagementPage` | ADMIN |
| `/reports` | `ReportsPage` (PDF/Excel export) | officer+ |
| `/settings`, `/notifications`, `/profile` | account pages | all |
| `/login`, `/register` | auth (public) | — |
| `/request-help`, `/missing-portal` | **public portals** (no auth) | — |

**~35 operational pages** (`frontend/src/pages/`) plus a UI-kit demo set inherited
from the dashboard template (`UiElements/*`, `Charts/*`, `Tables/*`) which are not
part of the product.

## 12.2 Authentication flow (client)

`hooks/useAuth.tsx` (`AuthProvider`):
- **Login:** `authService.login()` → if `res.data.requires2FA` return it;
  else store `token` + `user` in `localStorage`, set Zustand `user` +
  `isAuthenticated`, schedule an auto-logout timer at token expiry (decoded from
  the JWT `exp`).
- **Session restore on load:** read `token` + `user`; if the token is expired,
  clear and stay on `/login`; else restore the session and refresh the profile
  from `GET /api/users/me` in the background (force logout if the server rejects
  the token).
- **Logout:** clear storage + state, redirect to `/login`.

> Note: the api-client comment says "HTTP-only cookies"; the implementation
> actually uses a `localStorage` bearer token — state the real mechanism.

## 12.3 State management

| Concern | Tool |
|---|---|
| Auth/session, incidents cache, active incident, search query, notifications | **Zustand** (`store/useAppStore.ts`) — single store, slices for `user`, `incidents`, `notifications` |
| Server data fetching + caching + refetch | **TanStack Query v5** — per-resource query keys, background refetch |
| Real-time push into the UI | **Socket.IO client** (`lib/socket.ts`) — listeners update Query cache / Zustand → components re-render live |
| Forms | controlled components + local `useState` |
| Theme (light/dark) | `context/ThemeContext.tsx` |
| Sidebar collapse | `context/SidebarContext.tsx` |

## 12.4 Maps & visualisation

- **`MapPage`** — React Leaflet map: incident markers (severity-coloured),
  relief-camp markers, live volunteer/citizen positions (Socket.IO), a
  `leaflet.heat` incident-density heat layer, layer toggles.
- **`WaterMonitorPage`** — per-gauge cards (current level, trend, thresholds) +
  an ApexCharts line chart of the LSTM T+1/T+2 forecast; auto-refreshes on the
  `/water` namespace `water_data_updated` event.
- **`RiverMappingsPage`** — gauge → downstream-district mapping editor.
- **`AIResearchPage`** — interactive: shows the severity model's class
  probabilities, the routing threshold, the uncertainty band, and the
  hotspot-forecast risk per district — the "explainable AI" view.
- **`DashboardPage`** — stat cards (`GET /api/dashboard/stats`), recent alerts,
  recent incidents, KPI charts (Recharts).
- **`DonationsPage`**, **`ReportsPage`** — charts + PDF/Excel export
  (`pdfkit` / `exceljs` server-side).

## 12.5 Internationalisation

`i18next` + `react-i18next`; locale JSON under `src/locales/{en,si,ta}/`.
Language auto-detected (`i18next-browser-languagedetector`) and switchable in
Settings. Missing keys fall back to English.

## 12.6 API & real-time clients

- `lib/api-client.ts` — an axios instance, `baseURL = VITE_API_URL` (default
  `http://localhost:3001/api`), `withCredentials: true`, a request interceptor
  for the bearer token.
- `lib/socket.ts` — Socket.IO client to the backend origin.

## 12.7 Build & tooling

- `npm run dev` → Vite dev server on `:5173` (HMR).
- `npm run build` → `tsc -b && vite build` → static assets.
- `npm run lint` → ESLint (typescript-eslint, react-hooks, react-refresh).
- Tailwind v4 via `@tailwindcss/vite`; `clsx` + `tailwind-merge` (`lib/utils.ts`
  `cn()` helper — unit-tested).

## 12.8 Frontend testing coverage (for Chapter 5 cross-reference)

- **Unit (Vitest, `tests/unit/frontend/`):** `cn()` class-merge helper (5),
  `useModal` hook (5), `useAppStore` Zustand store (7).
- **E2E (Playwright, `tests/playwright/`):** 29 spec files across auth,
  dashboard, incidents, alerts, camps, map, water-monitor, hospital, users,
  navigation, settings, notifications, family-safety, help-requests,
  missing-persons, donations, ai-research, tokens, volunteers, reports.
  Chromium result after the auth-bootstrap fix: **63 / 79 (80%)**; the remaining
  16 are stale test selectors (pages render correctly) plus one real backend
  finding (predictions latency, now fixed). See `17 §6`.
