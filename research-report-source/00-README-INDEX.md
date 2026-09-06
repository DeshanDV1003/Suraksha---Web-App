# Suraksha — Research Report Source Pack

This directory contains the raw, factual material for writing the final-year
research report on **Suraksha — an AI-assisted disaster-management platform for
Sri Lanka**. It documents both applications end to end: database, backend,
web frontend, mobile app, the Python ML microservice, and every category of
testing performed.

> **Purpose.** These files are *source material*, not the report itself. Copy the
> relevant explanations, tables, and figure specifications into your Word
> document, then produce the actual diagrams in draw.io as your lecturer requires.
> Every number here is traced to a file in the codebase or to a real evaluation
> run — nothing is invented.

---

## How the files map to your report structure

| Report section | Use these files |
|---|---|
| **Ch. 1 — Introduction** | `01-introduction.md`, `21-system-flow-and-user-journeys.md` (workflow / "how it works") |
| **Ch. 2 — Literature Review / Related Work** | `02-literature-review.md` |
| **Ch. 3 — Methodology / System Analysis & Design** | `03-methodology.md`, `04-requirements.md`, `05-architecture.md`, `06-database-design.md`, `07-use-cases.md`, `08-activity-diagrams.md`, `09-sequence-diagrams.md`, `10-class-diagram.md` |
| **Ch. 4 — Implementation / Development** | `05-architecture.md`, `11-backend-implementation.md`, `12-frontend-implementation.md`, `13-mobile-implementation.md`, `14-ml-service.md`, `16-algorithms-and-flowcharts.md` |
| **Ch. 5 — Testing / Evaluation / Results** | `15-ml-evaluation.md`, `17-testing-and-evaluation.md`, `18-results-discussion.md` |
| **Conclusion** | `19-conclusion.md` |
| **Appendix A — Full test cases** | `appendices/appendix-A-test-cases.md` (+ `tests/test-cases/Suraksha_Test_Cases.xlsx`) |
| **Appendix B — Additional use-case / system diagrams** | `07-use-cases.md`, `appendices/appendix-D-diagram-drawing-guide.md` |
| **Appendix E — Algorithm / code snippets** | `16-algorithms-and-flowcharts.md`, `appendices/appendix-E-code-snippets.md` |
| **Front matter — List of Abbreviations** | `appendices/appendix-B-abbreviations.md` |
| **Front matter — List of Figures / Tables / Appendices** | `appendices/appendix-G-figure-table-register.md` |
| **Front matter, page numbering, section breaks, References/Zotero** | `20-front-matter-and-formatting.md` |
| **Screenshots (Ch. 4/5)** | `appendices/appendix-C-screenshots-guide.md` |
| **Final Appendix — Meeting minutes** | `appendices/appendix-F-meeting-minutes-template.md` |

---

## The evidence chain (keep the report telling one story)

```
Problem: SL disaster response is slow, fragmented, single-language, and breaks when the network fails
   ↓
Gap: no single platform unifies trilingual citizen reporting + offline-first mobile capture
     + ML triage/forecasting + a DMC command dashboard, evaluated on real DMC data
   ↓
Objectives (RO1–RO5)  →  Research Questions (RQ1–RQ4)
   ↓
Methodology: Design Science Research; real DMC datasets; iterative build; multi-layer evaluation
   ↓
Requirements (SRS, module-wise)  →  Design (architecture, ER, UML)
   ↓
Implementation: monorepo web (React 19 + Express + Prisma + PostgreSQL),
     Expo/React Native mobile (offline SQLite queue), FastAPI ML microservice
   ↓
Algorithms: LSTM river forecasting, XGBoost severity triage + uncertainty routing,
     NER entity extraction, GB spatiotemporal risk, credibility scoring, geo-targeting, offline sync
   ↓
Testing: 52 unit tests, 168 documented test cases (98% pass), k6 load (p95 533 ms),
     Playwright E2E (Chromium 80%)
   ↓
ML Evaluation: each model trained + compared against baselines; selection justified
   ↓
Results & Discussion  →  Conclusion (contributions, limitations, future work)
```

---

## Key headline facts (all traced)

| Item | Value | Source |
|---|---|---|
| Database models (tables) | **72** Prisma models, 24 enums | `backend/prisma/schema.prisma` |
| Backend REST route groups | **31** (`/api/auth` … `/api/hospital`) | `backend/src/index.ts` |
| Web frontend feature pages | **~35** operational pages (48 `.tsx` incl. UI-kit demos) | `frontend/src/pages/` |
| Mobile app screens | **25** screens | `D:\Suraksha - Mobile App\src\screens` |
| ML microservice endpoints | **22** FastAPI routes | `suraksha-ml/main.py` |
| ML/AI components total | **16** (5 with genuinely trained saved models; rest analytical/heuristic/pre-trained) | `suraksha-ml/ml/`, `nlp/`, `models/` |
| Trained models | Severity XGBoost, LSTM water, NER, Credibility XGBoost, Spatiotemporal GB | `suraksha-ml/models/*_info.json` |
| Documented test cases | **168** (100 web/API + 68 mobile) — 98% of executed pass | `tests/test-cases/Suraksha_Test_Cases.xlsx` |
| Unit tests | **52** (Vitest) | `tests/unit/` |
| Load test (100 VU, 5 min) | p95 **533 ms**, 0% errors, 64 req/s | `tests/k6/results/2026-09-06/` |
| E2E (Chromium) | **63 / 79 (80%)** after harness fix | `tests/runs/2026-09-06/playwright-rerun/` |

---

## File list

| File | Contents |
|---|---|
| `01-introduction.md` | Problem, gap, RO1–RO5, RQ1–RQ4, scope, novelty, contributions, viva prep |
| `02-literature-review.md` | Related disaster-management systems + technique review + gap table |
| `03-methodology.md` | Design Science Research process, datasets, dev cycle, evaluation design |
| `04-requirements.md` | Functional requirements by module + non-functional requirements + actors |
| `05-architecture.md` | 4-layer architecture, component responsibilities, tech-stack rationale |
| `06-database-design.md` | All 72 tables grouped, keys, relationships, cardinality, ER-diagram spec |
| `07-use-cases.md` | 8 module use-case sets, actor catalogue, per-diagram assumptions |
| `08-activity-diagrams.md` | 3 main processes as step lists ready to draw |
| `09-sequence-diagrams.md` | 3 main processes as participant + message lists |
| `10-class-diagram.md` | Backend class/module structure for the class diagram |
| `11-backend-implementation.md` | Express + Prisma layering, middleware, cron jobs, sockets, security |
| `12-frontend-implementation.md` | React 19 dashboard: routing, RBAC, state, i18n, maps |
| `13-mobile-implementation.md` | Expo/RN: navigation, offline-first sync architecture, device APIs |
| `14-ml-service.md` | FastAPI service: all 16 components, endpoints, which are trained |
| `15-ml-evaluation.md` | Per-model algorithm comparison tables + selection rationale (Ch. 5 core) |
| `16-algorithms-and-flowcharts.md` | 6 key algorithms: pseudocode + explanation + flowchart spec |
| `17-testing-and-evaluation.md` | Test strategy, all suites, results, bugs found & fixed |
| `18-results-discussion.md` | Consolidated results, achievement vs objectives, limitations |
| `19-conclusion.md` | Summary, contributions, future work |
| `20-front-matter-and-formatting.md` | Word assembly: structure, 10k word-count allocation, section breaks, page numbering, figure/table caption rules, References vs Bibliography, Zotero, consistency check |
| `21-system-flow-and-user-journeys.md` | **What each user role actually does, screen by screen**, + 6 end-to-end operational flows (flood report online/offline, automated river warning, relief-token claim, family check-in, hospital referral) + a one-paragraph "how it all connects" |
| `appendices/appendix-A-test-cases.md` | Full 168-case catalogue reference |
| `appendices/appendix-B-abbreviations.md` | Alphabetical abbreviation table |
| `appendices/appendix-C-screenshots-guide.md` | The 5 role screenshots + captions |
| `appendices/appendix-D-diagram-drawing-guide.md` | Exactly what to draw in draw.io for each figure |
| `appendices/appendix-E-code-snippets.md` | Key code snippets for the report |
| `appendices/appendix-F-meeting-minutes-template.md` | Meeting-minutes structure + signing sheet |
| `appendices/appendix-G-figure-table-register.md` | Proposed Figure X.Y / Table X.Y numbering + List of Appendices |

---

## Important honesty notes for the viva (read these)

1. **Not every "AI" component is a trained model.** Of 16 ML/AI components, **5 have
   genuinely trained saved model weights** (severity XGBoost, LSTM water, NER,
   credibility XGBoost, spatiotemporal GB). The rest are analytically implemented
   (attention math, NSGA-II-style Pareto search, rule-based hotspot/heuristics) or
   pre-trained library calls (face matching). State this plainly — examiners
   respect a candid inventory more than an inflated one. See `14-ml-service.md`.
2. **The NER model is evaluated silver-standard** — its 0.96 macro-F1 measures how
   well the neural model reproduces the rule-based auto-labeller on unseen PDFs,
   not ground-truth extraction quality against human annotation. Say so.
3. **The LSTM improvement over the naïve persistence baseline is small**
   (val MAE 0.343 m vs 0.361 m). That is an honest, defensible result for
   short-horizon hydrology — do not overclaim.
4. **The credibility model is trained on labelled synthetic crowdsourced
   scenarios**, because the real DMC export contains only official-source records
   and therefore has no genuine low-credibility examples. The synthetic labels are
   built from independent corroboration/noise signals, not a 1:1 function of the
   model's own features. See `15-ml-evaluation.md`.
5. **All diagrams in the report must be redrawn in draw.io.** These files give you
   the exact content; `appendix-D` tells you how to lay each one out.
