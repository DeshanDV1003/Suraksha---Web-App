# 07 — Use-Case Model (Chapter 3 source — module-wise use cases)

> Your lecturer wants use cases **module-wise**, 2–3 diagrams in the chapter, the
> rest in an appendix, each preceded by an explanation of *what it shows, which
> module, assumptions, why*. This file gives you all 8 module use-case sets. Draw
> each as a separate draw.io use-case diagram (stick-figure actors, oval use
> cases, `<<include>>` / `<<extend>>` where noted).
>
> **In Chapter 3 put:** UC-M1 (Authentication & User Management), UC-M2 (Incident
> Management), UC-M4 (River & Alert Management). **In Appendix B put:** UC-M3, M5,
> M6, M7, M8.

## Actor catalogue (draw once, reuse)

| Actor | Inherits from |
|---|---|
| Citizen | — |
| Volunteer | Citizen |
| Field Responder | Volunteer |
| DMC Officer | — |
| Administrator | DMC Officer |
| Hospital Staff | — |
| Local Verifier | Citizen |
| System Scheduler *(time/rule-triggered)* | — |
| External Service *(Twilio / Expo / Telegram / Open-Meteo / Nominatim)* | — |

---

## UC-M1 — Authentication & User Management

**What it shows:** how every actor obtains and uses an authenticated, role-scoped
session, and how administrators govern accounts.
**Assumptions:** (1) every protected action requires a valid JWT; (2) roles are
mutually exclusive and assigned at registration or changed only by an
administrator; (3) Google sign-in is restricted to CITIZEN/VOLUNTEER; (4) 2FA is
optional and only for administrators.

| UC | Actor(s) | Description | Notes |
|---|---|---|---|
| UC-M1.1 Register account | Citizen | Create an account (name, e-mail, password, phone, role) | password hashed `<<include>> Hash password` |
| UC-M1.2 Log in | all human actors | Authenticate with e-mail + password → JWT | `<<extend>> Prompt 2FA` (Administrator) |
| UC-M1.3 Log in with Google | Citizen, Volunteer | OAuth sign-in | |
| UC-M1.4 Verify 2FA code | Administrator | Enter TOTP code to complete login | |
| UC-M1.5 View / edit own profile | all human actors | | |
| UC-M1.6 Change password | all human actors | `<<include>> Verify current password` | |
| UC-M1.7 List all users | Administrator | | |
| UC-M1.8 Change user role | Administrator | | |
| UC-M1.9 Deactivate / delete user | Administrator | | |
| UC-M1.10 Configure RBAC permissions | Administrator | per (role, module) view/edit/delete | |
| UC-M1.11 View session & audit logs | Administrator | | |

---

## UC-M2 — Incident Management

**What it shows:** the full life of a disaster incident from citizen capture,
through automatic ML enrichment and duplicate detection, to officer verification,
triage, task dispatch and closure.
**Assumptions:** (1) an incident always has a reporter and a location (text or
GPS); (2) ML enrichment is best-effort and asynchronous — the incident is usable
before it completes; (3) only officers/administrators change status or delete;
(4) duplicate links are *suggestions* an officer confirms or dismisses.

| UC | Actor(s) | Description | Notes |
|---|---|---|---|
| UC-M2.1 Report incident | Citizen | Title, description, category, location, GPS, photos | `<<include>> Geocode location` (if no GPS), `<<include>> Tag district zone` |
| UC-M2.2 Trigger SOS | Citizen | One-tap high-priority incident from GPS | `<<extend>> Report incident` |
| UC-M2.3 Enrich incident with ML | System Scheduler / ML Service | Severity, language, translation, entities written back | `<<include>> Detect duplicates` |
| UC-M2.4 Detect duplicate incidents | System | Link near-identical reports (location + category + time + entities) | |
| UC-M2.5 View incident list / detail | DMC Officer, Administrator | filter by category / status | |
| UC-M2.6 View my incidents | Citizen | own reports only | |
| UC-M2.7 Verify incident | Local Verifier | confirm / reject / needs-investigation in jurisdiction | |
| UC-M2.8 Update incident status | DMC Officer | PENDING → ASSIGNED → IN_PROGRESS → RESOLVED (EN_ROUTE/ON_SITE for responders) | `<<include>> Log status history`, `<<include>> Notify reporter` |
| UC-M2.9 Assign task from incident | DMC Officer | create a `Task` for a volunteer | |
| UC-M2.10 Review duplicate links | DMC Officer | confirm / dismiss suggested duplicates | |
| UC-M2.11 Delete incident | Administrator | | |
| UC-M2.12 File After-Action Report | DMC Officer | timeline, resources used, cost, lessons | |

---

## UC-M3 — Help Requests & Rescue Coordination

**What it shows:** how requests for help (from citizens or the public) are
received, clustered, escalated, and serviced by rescue vehicles/missions.
**Assumptions:** (1) the public can request help without an account; (2)
unattended requests escalate automatically on a timer; (3) a rescue mission is
tied to exactly one vehicle and one target area.

| UC | Actor(s) | Description |
|---|---|---|
| UC-M3.1 Submit help request (authenticated) | Citizen | type, description, location, people count |
| UC-M3.2 Submit public help request | External public (unauthenticated) | name + phone + details |
| UC-M3.3 List / filter help requests | DMC Officer | |
| UC-M3.4 Cluster help requests | DMC Officer | geographic grouping for dispatch |
| UC-M3.5 Assign responder & update status | DMC Officer | |
| UC-M3.6 Escalate unattended request | System Scheduler | `<<include>> Notify officers` |
| UC-M3.7 Manage rescue vehicles | DMC Officer | register, set status/location |
| UC-M3.8 Create & track rescue mission | DMC Officer | assign vehicle to area, record evacuated count |
| UC-M3.9 Check in at safe zone | Citizen | at a camp / safe place |

---

## UC-M4 — River & Alert Management

**What it shows:** the automated hydrological monitoring → forecasting →
threshold-alerting pipeline and the manual alert-authoring path.
**Assumptions:** (1) river readings arrive hourly, rainfall every 30 min; (2) an
ML forecast only fires an alert at confidence ≥ 0.75 and a threat within 2 h; (3)
an alert reaches a citizen only if the citizen is inside the broadcast radius or
the alert is "All Island"; (4) alert dispatch to SMS/push/e-mail/Telegram is
best-effort.

| UC | Actor(s) | Description | Notes |
|---|---|---|---|
| UC-M4.1 Ingest river / rainfall data | System Scheduler / Open-Meteo | hourly / 30-min cron | |
| UC-M4.2 Forecast gauge level (T+1h/T+2h) | ML Service | per gauge, with confidence + alert level | `<<include>> Cache prediction` |
| UC-M4.3 Evaluate thresholds & generate alert | System | forecast or reading crosses watch/warning/critical | `<<include>> Map downstream districts`, `<<include>> Dispatch alert` |
| UC-M4.4 View river levels / rainfall / predictions | Citizen, DMC Officer | | |
| UC-M4.5 Create alert manually | Administrator | title, message, type, target area, radius, schedule | `<<include>> Translate to Si/Ta`, `<<include>> Dispatch alert` |
| UC-M4.6 Dispatch alert (multi-channel) | System / External Services | in-app + push + SMS + e-mail + Telegram | |
| UC-M4.7 Receive relevant alert | Citizen | filtered by location | |
| UC-M4.8 Acknowledge alert | Citizen | | |
| UC-M4.9 Deactivate / delete alert | Administrator | | |
| UC-M4.10 Edit gauge → downstream-district mapping | DMC Officer | | |
| UC-M4.11 View alert delivery statistics | DMC Officer | notified count, acknowledgement rate | |

---

## UC-M5 — Relief Camps, Resources, Tokens & Donations

**Assumptions:** (1) camp occupancy can never exceed capacity; (2) a relief token
is single-purpose (category-scoped) and usage-limited; (3) a token claim is
recorded with the claim location and updates a fraud-risk score; (4) donations
fund donor campaigns which fund token issuance.

| UC | Actor(s) | Description |
|---|---|---|
| UC-M5.1 Create / manage relief camp | DMC Officer | name, location, capacity, services |
| UC-M5.2 Update camp occupancy | DMC Officer | guarded ≤ capacity |
| UC-M5.3 Manage camp residents / inventory / schedule | DMC Officer | check-in/out, item thresholds |
| UC-M5.4 Request & fulfil camp supplies | DMC Officer | `CampSupplyRequest` |
| UC-M5.5 Request inter-camp transfer | DMC Officer | |
| UC-M5.6 Optimise resource allocation | DMC Officer / ML Service | multi-objective district allocation |
| UC-M5.7 Issue relief token | DMC Officer | QR-coded, category-scoped, household bundle option |
| UC-M5.8 Claim relief token | Citizen (at camp) | `<<include>> Validate token (active/not-expired/under-limit)`, `<<include>> Record claim + fraud score` |
| UC-M5.9 View my relief tokens (offline) | Citizen | |
| UC-M5.10 Submit donation | Citizen / Donor | monetary or material; positive amount |
| UC-M5.11 View donation history | DMC Officer | |
| UC-M5.12 Manage donor campaign | Administrator | |

---

## UC-M6 — Missing Persons, Damage & Hospital Referral

**Assumptions:** (1) the missing-persons list is public (no sensitive contact
data exposed); (2) a damage assessment routes through a review workflow before
compensation eligibility; (3) a hospital referral originates from a camp and is
accepted by a hospital.

| UC | Actor(s) | Description |
|---|---|---|
| UC-M6.1 Report missing person | Citizen | name, age, description, last seen, photo |
| UC-M6.2 Browse public missing-persons list | External public | |
| UC-M6.3 Mark person found / reunified | DMC Officer | |
| UC-M6.4 Match face against missing persons | DMC Officer / ML Service | |
| UC-M6.5 Submit damage assessment | Citizen | category, damage levels, media, estimated loss |
| UC-M6.6 Score damage & estimate cost | ML Service | `<<include>>` in UC-M6.5 |
| UC-M6.7 Review damage assessment | DMC Officer / senior reviewer | PENDING_REVIEW → VERIFIED/REJECTED/SENIOR_REVIEW → APPROVED |
| UC-M6.8 Determine compensation eligibility | DMC Officer | eligibility score + flag |
| UC-M6.9 Manage hospital bed capacity | Hospital Staff | per ward |
| UC-M6.10 Create patient referral from camp | DMC Officer | patient, severity, transport |
| UC-M6.11 Accept / update referral status | Hospital Staff | PENDING → IN_TRANSIT → ADMITTED → DISCHARGED |

---

## UC-M7 — Family Safety & Volunteers

**Assumptions:** (1) a citizen can only see the safety status of their own linked
family members; (2) a volunteer sees and updates only their own tasks; (3)
wellbeing logs are private to the volunteer + welfare officers.

| UC | Actor(s) | Description |
|---|---|---|
| UC-M7.1 Add / edit family member | Citizen | name, relation, phone |
| UC-M7.2 View family safety status | Citizen | own group only |
| UC-M7.3 Broadcast "I am SAFE / NEEDS_HELP" | Citizen | with location, to linked members |
| UC-M7.4 Maintain volunteer profile | Volunteer | skills, trainings, readiness |
| UC-M7.5 Check in / out of a zone | Volunteer | GPS, accrues active hours |
| UC-M7.6 Log wellbeing (physical/mental) | Volunteer | distress flag |
| UC-M7.7 View recommended incidents | Volunteer | skill + proximity match |
| UC-M7.8 Create task | DMC Officer | assign to a volunteer |
| UC-M7.9 Update own task status | Volunteer | ASSIGNED → IN_PROGRESS → RESOLVED, accrues hours |
| UC-M7.10 Compose response team | DMC Officer / ML Service | skill + proximity optimisation |

---

## UC-M8 — Analytics, Notifications & System Administration

**Assumptions:** (1) analytics are read-only aggregates; (2) the ML situation
summary / hotspot forecast / drift report are advisory; (3) the DB backup is
automatic daily and manually triggerable by an administrator.

| UC | Actor(s) | Description |
|---|---|---|
| UC-M8.1 View dashboard statistics | DMC Officer | active incidents, alerts, camps, water status |
| UC-M8.2 View operational-intelligence analytics | DMC Officer | trends |
| UC-M8.3 Generate situation summary | DMC Officer / ML Service | natural-language brief |
| UC-M8.4 Forecast district hotspots | DMC Officer / ML Service | risk per district |
| UC-M8.5 Detect data drift | ML Service | vocabulary / distribution shift |
| UC-M8.6 View notification inbox / mark read | all human actors | |
| UC-M8.7 View audit log | Administrator | |
| UC-M8.8 Trigger manual DB backup | Administrator | |
| UC-M8.9 Switch UI language (Si/Ta/En) | all human actors | |

---

## Explanation template to paste before each use-case diagram

> **Figure 3.x — Use-Case Diagram: <Module Name> Module.**
> This diagram represents the **<module>** module of the Suraksha platform. It
> shows the interactions available to <primary actors>. The diagram assumes
> <assumption 1>, <assumption 2>, and <assumption 3>. It was designed this way
> because <reason tied to a requirement in `04-requirements.md`>. Use cases
> connected by `<<include>>` are mandatory sub-steps; `<<extend>>` marks optional
> behaviour triggered only under the stated condition.
