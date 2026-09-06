# Appendix C — System Screenshots Guide

> Lecturer guideline 11: **5 main screenshots** based on the major user roles,
> each with a **20–30 word explanation**, each demonstrating an **important
> system function**. Figure caption goes **below** the figure. Numbering:
> `Figure 4.<n>` (Chapter 4). Take the screenshots yourself from the running
> system.

## How to capture

1. Start the stack: PostgreSQL, backend (`:3001`), web (`npm run dev` → `:5173`),
   ML (`:8000`). Seed some incidents / alerts / camps / gauges so the screens
   have content.
2. Log in as each role (see `tests/playwright/.env` for the seeded test
   accounts, or register fresh ones).
3. Capture at ~1440 px width, light theme, no personal data visible.
4. Crop to the meaningful content; annotate nothing (raw screenshot).

## The 5 screenshots

### Figure 4.1 — DMC Officer: Command Dashboard (`/`, role DMC_OFFICER / ADMIN)
**Function shown:** the common operating picture.
**Caption (below the figure):**
> **Figure 4.1: DMC Officer Command Dashboard.** The dashboard gives officers a
> single view of active incidents, live alerts, relief-camp occupancy and river
> status, with trend charts, so the current state of the response can be assessed
> at a glance.

### Figure 4.2 — DMC Officer: Live Incident Map (`/map`)
**Function shown:** real-time geospatial situational awareness.
**Caption:**
> **Figure 4.2: Live Incident Map.** Severity-coloured incident markers, relief
> camps and live citizen/volunteer positions are plotted on an interactive map
> with a density heat-layer, updating in real time over Socket.IO without a page
> refresh.

### Figure 4.3 — DMC Officer: Water Monitoring & LSTM Forecast (`/water-monitor`)
**Function shown:** the hydrological forecasting output.
**Caption:**
> **Figure 4.3: River Water-Level Monitoring.** Each gauge card shows the current
> level, trend and flood thresholds alongside the LSTM T+1 h / T+2 h forecast and
> its confidence, feeding the automatic downstream-district alerting pipeline.

### Figure 4.4 — DMC Officer: Explainable-AI Research View (`/ai-research`)
**Function shown:** the ML triage + uncertainty layer, made inspectable.
**Caption:**
> **Figure 4.4: AI Research & Explainability View.** The severity classifier's
> per-class probabilities, the uncertainty-routing threshold and the
> district-level hotspot-risk forecast are displayed so officers can see why a
> given incident was auto-accepted or routed for human review.

### Figure 4.5 — Citizen (Mobile): Offline Incident Report
**Function shown:** the offline-first capture that is the mobile research
contribution.
**Caption:**
> **Figure 4.5: Mobile Incident Report — Offline Mode.** A citizen submits an
> incident with photo evidence and GPS while the device is offline; the report is
> saved to the local SQLite queue and marked "queued", then synchronised
> automatically when connectivity returns with no data loss.

### (Alternative / 6th if your report allows) Figure 4.6 — Hospital Staff: Bed Capacity & Referrals (`/hospital/capacity`)
**Caption:**
> **Figure 4.6: Hospital Capacity & Referral Management.** Hospital staff update
> per-ward bed availability and accept patient referrals raised by relief camps,
> with referral status tracked from PENDING through IN_TRANSIT to ADMITTED.

## Role → page cheat-sheet for capturing

| Role | Log in and go to |
|---|---|
| Administrator | `/` (dashboard), `/users` (user management) |
| DMC Officer | `/`, `/incidents`, `/map`, `/water-monitor`, `/ai-research`, `/camps` |
| Hospital Staff | `/hospital`, `/hospital/capacity`, `/hospital/referrals` |
| Citizen (web) | `/citizen-home`, public portals `/request-help`, `/missing-portal` |
| Citizen (mobile) | Home, Report (toggle airplane mode for the offline shot), Alerts, Water Level, Family Safety |
| Volunteer (mobile) | Tasks tab |
