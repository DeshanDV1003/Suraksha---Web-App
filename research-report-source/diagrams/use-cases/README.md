# Use-Case Diagrams — draw.io source files

8 editable `.drawio` files, one per module, matching **Suraksha_Draft_Thesis_3**:

| File | Thesis figure | Module |
|---|---|---|
| `Figure_4.3_UseCase_Authentication_and_User_Management.drawio` | **Figure 4.3** (Chapter 4) | Authentication & User Management (UC-M1) |
| `Figure_4.4_UseCase_Incident_Management.drawio` | **Figure 4.4** (Chapter 4) | Incident Management (UC-M2) |
| `Figure_4.5_UseCase_River_and_Alert_Management.drawio` | **Figure 4.5** (Chapter 4) | River & Alert Management (UC-M4) |
| `Appendix_B.1_UseCase_Help_Requests_and_Rescue_Coordination.drawio` | **Appendix B.1** | Help Requests & Rescue Coordination (UC-M3) |
| `Appendix_B.2_UseCase_Relief_Camps_Resources_Tokens_and_Donations.drawio` | **Appendix B.2** | Relief Camps, Resources, Tokens & Donations (UC-M5) |
| `Appendix_B.3_UseCase_Missing_Persons_Damage_and_Hospital_Referral.drawio` | **Appendix B.3** | Missing Persons, Damage & Hospital Referral (UC-M6) |
| `Appendix_B.4_UseCase_Family_Safety_and_Volunteers.drawio` | **Appendix B.4** | Family Safety & Volunteers (UC-M7) |
| `Appendix_B.5_UseCase_Analytics_Notifications_and_System_Administration.drawio` | **Appendix B.5** | Analytics, Notifications & System Administration (UC-M8) |

## How to use

1. Open each file at **app.diagrams.net** (or the draw.io desktop app / VS Code
   draw.io extension) — File → Open.
2. **Tidy the layout** if you want (the generator lays things out on a grid but
   doesn't route edges): select all → *Arrange* tab → *Layout* → try
   "Vertical Tree" off; usually it's enough to drag a few use cases so the
   association lines don't cross a use case. Right-click an edge → *Edit Style* →
   `edgeStyle=orthogonalEdgeStyle` if you prefer right-angled connectors.
3. **Export** for the Word document: File → Export as → **PNG** (300 DPI,
   transparent off) or **PDF**. Insert into Word; add the caption **below** the
   figure via Insert → Caption ("Figure 4.3: Use-Case Diagram – Authentication
   and User Management Module").

## Notation used (matches UML)

| Element | Style in the file |
|---|---|
| Actor | stick figure (`shape=umlActor`) — human actors on the left, system/external actors on the right |
| Use case | blue ellipse |
| `«include»` / `«extend»` sub-use-case | green dashed ellipse |
| Association (actor ↔ use case) | plain solid line, no arrowhead |
| `«include»` | green dashed line, open arrowhead → the included use case |
| `«extend»` | orange dashed line, open arrowhead → the base use case |
| Actor generalisation (e.g. Volunteer ▷ Citizen) | grey line, hollow triangle → the parent |
| System boundary | rectangle, module name as the top label |

## Explanation paragraph to place *before* each figure (lecturer guideline 14–15)

Use this template (the assumptions are already in the thesis Appendix B text and
in `../../07-use-cases.md`):

> **Figure 4.3: Use-Case Diagram – Authentication and User Management Module.**
> This diagram represents the authentication and user-management module. It shows
> the interactions available to the Citizen, Volunteer and Administrator actors
> (Volunteer specialises Citizen). It assumes that every protected action requires
> a valid JSON Web Token, that roles are assigned at registration and changed only
> by an administrator, that Google sign-in is limited to citizens and volunteers,
> and that two-factor authentication is optional and available only to
> administrators. It was designed this way because a disaster-management command
> system must strictly separate what each role can see and do, so account
> governance (list users, change role, deactivate, configure RBAC, view audit
> logs) is modelled as administrator-only. Use cases joined by `«include»` are
> mandatory sub-steps; `«extend»` marks the optional 2FA prompt triggered only for
> administrator logins.

> **Figure 4.4: Use-Case Diagram – Incident Management Module.**
> This diagram represents the incident-management module — the full life of a
> disaster incident from citizen capture, through automatic machine-learning
> enrichment and duplicate detection, to officer verification, triage, task
> dispatch and closure. Its actors are the Citizen, the Local Verifier, the DMC
> Officer, the Administrator (who specialises the DMC Officer), and the non-human
> ML Service and System Scheduler. It assumes an incident always has a reporter
> and a location, that ML enrichment is best-effort and asynchronous, that only
> officers and administrators change status or delete, and that duplicate links
> are suggestions a human confirms. It was designed this way because the citizen
> report is unstructured and unverified on arrival, so the system enriches and
> de-duplicates it automatically while leaving every consequential decision
> (severity confirmation, dispatch, deletion) to a human.

> **Figure 4.5: Use-Case Diagram – River and Alert Management Module.**
> This diagram represents the automated hydrological-monitoring, forecasting and
> threshold-alerting pipeline together with the manual alert-authoring path. Its
> actors are the Citizen, the DMC Officer, the Administrator, and the non-human
> System Scheduler, ML Service and External Services (SMS, push, e-mail,
> Telegram). It assumes river readings arrive hourly and rainfall every thirty
> minutes, that an automated alert fires only at forecast confidence of at least
> 0.75 with a threat within two hours, that a citizen receives an alert only when
> it is relevant to their location, and that multi-channel dispatch is
> best-effort. It was designed this way because a threshold breach forecast one to
> two hours ahead gives downstream communities usable lead time, and automating
> that path removes the officer from the time-critical loop while the confidence
> gate and location filter keep false and irrelevant alerts low.

*(Appendix B.1–B.5 explanations are already written in the thesis Appendix B
section — keep them.)*

## Regenerating

The files were produced from a declarative spec. To change a use case or a
relationship, edit the spec at the top of the generator and re-run:

```
node <scratchpad>/gen-usecase-drawio.cjs      # writes into this folder
```
(A copy of the generator is kept at `gen-usecase-drawio.cjs` in this folder.)
