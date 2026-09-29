# GitHub Repository Snapshot — Suraksha Web App & Mobile App

Pulled live from the GitHub API on 2026-09-25. Both repos default to different
branches; where activity differs meaningfully between the GitHub-configured
"default branch" and the actually-active `dev` branch, both are noted.

---

## 1. `DeshanDV1003/Suraksha---Web-App`

**URL:** https://github.com/DeshanDV1003/Suraksha---Web-App

### Folder/file structure (2 levels deep, default branch `production`)

```
Suraksha---Web-App/
├── .vscode/
├── backend/
│   ├── data/
│   ├── prisma/
│   ├── scratch/
│   ├── scripts/
│   └── src/
├── frontend/
│   ├── public/
│   ├── scratch/
│   ├── scratch_ts/
│   └── src/
├── river_data_extracted/
├── scratch/
├── suraksha-ml/
│   ├── dmc_data/
│   ├── ml/
│   ├── models/
│   ├── nlp/
│   ├── scratch/
│   └── training/
├── .gitignore
├── ADMIN_CREDENTIALS.txt
├── Suraksha_System_Overview.md
├── implementation_plan( For dark blocking Mode).md
├── package-lock.json
├── package.json
├── railway.json
├── start-db.bat
├── start-suraksha.bat
├── stop-db.bat
└── tsconfig.json
```

> ⚠️ **Note:** the `dev` branch (107 commits, last pushed 2026‑09‑23 — this is
> where all active work actually happens) additionally has top-level
> `project_docs/`, `research-report-source/`, `tests/`, and `DMC Records/`
> directories that are **not** present on `production` (last pushed
> 2026‑08‑11). `production` is a stale/lagging deployment branch.

### Primary language(s) & frameworks
GitHub language breakdown (by bytes): **TypeScript 67.1%**, JavaScript 26.8%,
Python 4.7%, CSS 1.2%, Batchfile 0.1%, HTML <0.1%.

It's a monorepo with three parts:
| Part | Stack |
|---|---|
| `frontend/` | React 19 + Vite 6 + TypeScript, Tailwind CSS 4, Zustand, TanStack Query, React Router 7, React-Leaflet, i18next |
| `backend/` | Node.js + Express 4 + TypeScript, Prisma ORM 6 + PostgreSQL, Socket.IO, JWT/speakeasy 2FA |
| `suraksha-ml/` | Python — FastAPI, PyTorch, TensorFlow/Keras, spaCy, scikit-learn, sentence-transformers, DeepFace |

### Key dependency versions
- **Node "engines" field:** ❌ not declared anywhere (root, `frontend/`, or
  `backend/` `package.json`). `frontend/devDependencies` pins `@types/node
  ^24.12.0`; `backend/devDependencies` pins `@types/node ^22.9.0` — soft
  hints only, not an enforced requirement.
- React `^19.2.4` · Vite `^6.0.1` · TypeScript `~5.6.3` (backend) / `~5.6.3`
  (frontend) · Tailwind CSS `^4.3.0` · TanStack Query `^5.91.3` · Zustand
  `^5.0.12` · React Router DOM `^7.13.1`
- Express `^4.21.1` · Prisma / `@prisma/client` `^6.4.1` (root also carries a
  separate `prisma ^7.8.0` devDependency) · Socket.IO `^4.8.1` · jsonwebtoken
  `^9.0.3` · speakeasy `^2.0.0` · groq-sdk `^1.5.0`
- Python (`suraksha-ml/requirements.txt`, pinned exact versions):
  `fastapi==0.110.0`, `uvicorn==0.29.0`, `torch==2.2.0`,
  `tensorflow==2.16.1`, `transformers==4.40.0`, `spacy==3.7.4`,
  `scikit-learn==1.4.2`, `deepface==0.0.93`, `pandas==2.2.2`

### Latest commit & release
| | |
|---|---|
| Latest commit — default branch (`production`) | `6423d2a` — 2026‑08‑11 — "fix: use VITE_API_URL for chatbot endpoint instead of hardcoded LAN IP" |
| Latest commit — `dev` branch (most active) | `f8929b4` — 2026‑09‑23 — "v21" |
| Release tags | **None** — 0 GitHub Releases, 0 git tags |

### Commit count & default branch
- **Default branch:** `production`
- **Commits on `production`:** **54**
- **Commits on `dev`:** **107** (the branch with all recent activity)
- Other branches present: `deploy`, `main`, `relief_token_fix`

### README / setup instructions
❌ **No project-level README.** The only `README.md` in the whole repo (either
branch) is `frontend/README.md`, and it's the **unmodified default Vite
template** boilerplate (React + TypeScript + Vite, ESLint config tips) — it
contains no actual Suraksha setup/installation instructions.

The closest thing to setup instructions is the **root `package.json`
scripts** (a monorepo with npm workspaces `frontend` + `backend`):
```bash
npm install               # install-all — installs both workspaces
npm run dev                # runs backend + frontend concurrently
npm run dev:all            # also starts the local PostgreSQL service first
npm run build               # builds both workspaces
npm run db:generate / db:migrate / db:push / db:seed   # Prisma commands
```
(`suraksha-ml/` — the Python ML microservice — has its own
`requirements.txt` but no documented run command in a README.)

### Visibility & license
- **Visibility:** Public
- **LICENSE file:** ❌ None found (root or any branch) — GitHub reports
  `license: null`.

---

## 2. `DeshanDV1003/Suraksha---Mobile-App`

**URL:** https://github.com/DeshanDV1003/Suraksha---Mobile-App

### Folder/file structure (2 levels deep, default branch `dev`)

```
Suraksha---Mobile-App/
├── assets/
├── backend/
│   ├── prisma/
│   └── src/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── i18n/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── storage/
│   ├── store/
│   └── utils/
├── .gitignore
├── App.tsx
├── BUILD-APK.bat
├── README.md
├── START-ML.bat
├── START.bat
├── Suraksha_System_Documentation.docx
├── app.json
├── babel.config.js
├── eas.json
├── index.ts
├── metro.config.js
├── nativewind-env.d.ts
├── offline_sync_results.json
├── package-lock.json
├── package.json
├── setup-ngrok.bat
├── start-dev.ps1
├── sync_simulator.js
└── tailwind.config.js
```

### Primary language(s) & frameworks
GitHub language breakdown (by bytes): **TypeScript 98.5%**, JavaScript 0.8%,
PowerShell 0.5%, Batchfile 0.2%, CSS <0.1%.

**Framework:** React Native 0.81.5 via **Expo SDK 54**, styled with
NativeWind (Tailwind for RN), React Native Paper for UI components, React
Navigation (bottom tabs + native stack), Zustand for state, TanStack Query
for data fetching, i18next for Sinhala/Tamil/English localization, expo-sqlite
for the offline-first local queue.

### Key dependency versions
- **Node "engines" field:** ❌ not declared in `package.json`.
  `devDependencies` pins `@types/react ~19.1.10`, `typescript ~5.9.2`.
- Expo `~54.0.36` · React Native `0.81.5` · React `19.1.0` · TypeScript
  `~5.9.2` · Zustand `^5.0.12` · TanStack Query `^5.91.3` · React Navigation
  (`native` `^7.1.34`, `native-stack` `^7.14.6`, `bottom-tabs` `^7.15.6`) ·
  NativeWind `^4.2.3` · i18next `^25.9.0` · axios `^1.13.6` ·
  expo-sqlite `~16.0.10` · socket.io-client `^4.8.3`

### Latest commit & release
| | |
|---|---|
| Latest commit — default branch (`dev`) | `a1e9203` — 2026‑09‑23 — "v19" |
| Release tags | **None** — 0 GitHub Releases, 0 git tags |

### Commit count & default branch
- **Default branch:** `dev`
- **Commits on `dev`:** **28**
- Other branch present: `staging`

### README / setup instructions
✅ Has a real `README.md` at the repo root — summarized/copied as-is below:

> **Suraksha - Mobile App** — a Disaster Management System mobile app built
> with React Native and Expo.
>
> **Prerequisites:** Node.js (LTS), npm, and the **Expo Go** app on a
> physical device (recommended, especially on low-resource PCs/no
> emulator).
>
> **Setup:**
> ```bash
> npm install      # 1. Install Dependencies
> npm start        # 2. Start the Expo development server (opens QR code)
> ```
> **Run on a device:**
> - Physical device (recommended): open Expo Go, scan the QR code.
> - Android emulator: press `a` in the terminal.
> - iOS simulator (macOS only): press `i` in the terminal.
> - Web: press `w` in the terminal.
>
> **Project structure** (per README): `src/screens` (app screens),
> `src/navigation` (Bottom Tabs/Stack config), `src/store` (Zustand state),
> `src/i18n` (English/Sinhala/Tamil), `src/components` (reusable UI),
> `assets/` (images/icons/splash).
>
> **Technologies listed:** React Native (Expo) · NativeWind (Tailwind CSS) ·
> React Native Paper · React Navigation · Zustand · TanStack Query · i18next.

### Visibility & license
- **Visibility:** Public
- **LICENSE file:** ❌ None found — GitHub reports `license: null`.

---

## Quick comparison

| | Web App | Mobile App |
|---|---|---|
| Default branch | `production` (stale) / `dev` (active) | `dev` |
| Commits (default branch) | 54 (`production`) / 107 (`dev`) | 28 |
| Latest activity | 2026‑09‑23 (on `dev`) | 2026‑09‑23 |
| Releases/tags | 0 | 0 |
| Root README with setup steps | ❌ No | ✅ Yes |
| LICENSE file | ❌ No | ❌ No |
| Visibility | Public | Public |
