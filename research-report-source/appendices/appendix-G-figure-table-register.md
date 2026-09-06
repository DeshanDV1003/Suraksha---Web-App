# Appendix E (aux) — Figure & Table Register

> Front matter needs an auto-generated **List of Figures** and **List of Tables**.
> Number as `Figure <Chapter>.<n>` / `Table <Chapter>.<n>` (lecturer guideline
> 12). Figure caption **below**; table caption **above** (guideline 13). This is a
> *proposed* register — adjust as you write. Use Word's caption + cross-reference
> feature so the lists build themselves.

## Proposed figures

| # | Figure | Source in this pack |
|---|---|---|
| Figure 1.1 | Sri Lanka flood/landslide hazard exposure (context map) | draw or cite a DMC map |
| Figure 1.2 | The four disaster-response problems Suraksha addresses | `01 §1.1` |
| Figure 1.3 | Research objectives → research questions → evaluation map | `01 §1.5–1.6`, `00-README-INDEX` evidence chain |
| Figure 2.1 | Capability matrix — Suraksha vs prior systems | `02 §2.6` |
| Figure 3.1 | Design Science Research process applied | `03 §3.1` |
| Figure 3.2 | System architecture (4-layer + external) | `05 §5.1`, `appendix-D §1` |
| Figure 3.3 | Core Entity-Relationship diagram | `06 §6.3`, `appendix-D §2` |
| Figure 3.4 | Use-Case Diagram — Authentication & User Management module | `07 UC-M1`, `appendix-D §3` |
| Figure 3.5 | Use-Case Diagram — Incident Management module | `07 UC-M2` |
| Figure 3.6 | Use-Case Diagram — River & Alert Management module | `07 UC-M4` |
| Figure 3.7 | Activity Diagram — Offline-first incident report & sync | `08 AD-1`, `appendix-D §4` |
| Figure 3.8 | Activity Diagram — Severity triage with human-in-the-loop routing | `08 AD-2` |
| Figure 3.9 | Activity Diagram — River forecast → threshold alert dispatch | `08 AD-3` |
| Figure 3.10 | Sequence Diagram — Offline report & later sync | `09 SD-1`, `appendix-D §5` |
| Figure 3.11 | Sequence Diagram — Severity triage & routing | `09 SD-2` |
| Figure 3.12 | Sequence Diagram — River forecast → alert | `09 SD-3` |
| Figure 3.13 | Class Diagram — Incident + Alert + Water subsystem | `10 §10.2`, `appendix-D §6` |
| Figure 4.1 | Screenshot — DMC Officer Command Dashboard | `appendix-C` |
| Figure 4.2 | Screenshot — Live Incident Map | `appendix-C` |
| Figure 4.3 | Screenshot — River Water-Level Monitoring | `appendix-C` |
| Figure 4.4 | Screenshot — AI Research & Explainability View | `appendix-C` |
| Figure 4.5 | Screenshot — Mobile Incident Report (offline mode) | `appendix-C` |
| Figure 4.6 | Trilingual intake pipeline | `14 §14.4`, `appendix-D §9` |
| Figure 4.7 | Mobile offline-sync architecture | `13 §13.2`, `appendix-D §8` |
| Figure 4.8 | Flowchart — Prediction cache & serve (ALG-1) | `16 ALG-1`, `appendix-D §7` |
| Figure 4.9 | Flowchart — Severity triage + uncertainty routing (ALG-3) | `16 ALG-3` |
| Figure 4.10 | Flowchart — Offline sync queue drain (ALG-6) | `16 ALG-6` |
| Figure 5.1 | Severity-classifier confusion matrix (raw DMC export) | `15 §15.1.5` |
| Figure 5.2 | Risk–coverage curve of the selective-review layer | `15 §15.1.4` |
| Figure 5.3 | LSTM forecast vs actual vs persistence (example gauge) | `15 §15.2` |
| Figure 5.4 | k6 load test — latency percentiles before vs after cache | `17 §3` |
| Figure 5.5 | Offline-sync data-loss vs condition (bar chart, all 0 %) | `17 §4` |

## Proposed tables

| # | Table | Source |
|---|---|---|
| Table 2.1 | Related-systems capability comparison | `02 §2.6` |
| Table 3.1 | DSR activities mapped to project work | `03 §3.1` |
| Table 3.2 | Data sources (DMC datasets) | `03 §3.3` |
| Table 3.3 | Epistemic-noise sensitivity (severity model) | `03 §3.4` |
| Table 3.4 | Evaluation design — four dimensions | `03 §3.6` |
| Table 3.5 | Functional requirements by module | `04 §4.2` |
| Table 3.6 | Non-functional requirements | `04 §4.3` |
| Table 3.7 | Technology choices & rationale | `05 §5.4` |
| Table 3.8 | Entity groups (72 tables) | `06 §6.1` |
| Table 3.9 | Enumerations | `06 §6.5` |
| Table 4.1 | Backend route groups (31) | `11 §11.2` |
| Table 4.2 | ML component classification (trained / pre-trained / analytical / heuristic) | `14 §14.3` |
| Table 4.3 | ML endpoints (22) | `14 §14.2` |
| Table 5.1 | Testing strategy | `17 §1` |
| Table 5.2 | Documented test-case results (per section) | `17 §2` |
| Table 5.3 | Defects found by functional testing & resolution | `17 §2` |
| Table 5.4 | k6 load test — before vs after | `17 §3` |
| Table 5.5 | Offline-sync stress results | `17 §4` |
| Table 5.6 | Security review findings | `17 §5` |
| Table 5.7 | NFR verification summary | `17 §7` |
| Table 5.8 | Severity-classifier algorithm comparison (grounded 2,000) | `15 §15.1.2` |
| Table 5.9 | Severity classifier — chronological hold-out | `15 §15.1.3` |
| Table 5.10 | Risk–coverage of the selective-review layer | `15 §15.1.4` |
| Table 5.11 | Severity classifier on the raw DMC export (146,544) | `15 §15.1.5` |
| Table 5.12 | LSTM water forecaster vs persistence baseline | `15 §15.2` |
| Table 5.13 | NER model evaluation (v2.1 → v2.2) | `15 §15.3` |
| Table 5.14 | Credibility model evaluation | `15 §15.4` |
| Table 5.15 | Spatiotemporal risk forecaster evaluation | `15 §15.5` |
| Table 5.16 | Trained models — consolidated selection summary | `15 §15.7` |
| Table 5.17 | Research objectives — outcome & evidence | `18 §18.1` |

## List of Appendices (front-matter page)

| Appendix | Title |
|---|---|
| Appendix A | Full Test Cases (168) |
| Appendix B | Additional Use-Case Diagrams (UC-M3, M5–M8) |
| Appendix C | Module Entity-Relationship Fragments + Additional System Diagrams |
| Appendix D | Additional Screenshots |
| Appendix E | Algorithm / Code Snippets |
| Appendix F *(final)* | Meeting Minutes |

*(Re-letter to match your actual placement; keep appendix headings right-aligned.)*
