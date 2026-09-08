# Suraksha — All Report Diagrams (editable draw.io)

Every diagram from **Suraksha_Interim_02**, regenerated from the **actual built
system** (the `research-report-source/` pack), not the older Interim wording.
Interim figure numbers/titles are kept. Open each `.drawio` at
**app.diagrams.net** or the VS Code draw.io extension, tidy, then
**File → Export as → PNG (300 DPI)** or PDF for Word.

> **Content corrections vs Interim-02** (the diagrams follow the code, which is what
> the viva panel can inspect):
> - **One** Express backend on `:3001` — not two backends on `:3001/:3002`.
> - Severity = **XGBoost + temperature scaling**; text = **spaCy NER** (trained) +
>   library NMT. No XLM-RoBERTa / MarianMT / MC-dropout / vision-transformer fusion
>   in the running pipeline.
> - Credibility = **XGBoost v3.1**; district risk = **GradientBoosting v3.0** — not
>   GAT / Spatial-GNN. Face match = pre-trained library call.
> - **72** Prisma models (not "50+"). **5** genuinely trained models.

---

## File → figure map

### Chapter 1–2 (context / literature)
| File | Figure | Notes |
|---|---|---|
| `Figure_1.1_Rich_Picture_Four_Layer_Sociotechnical_System.drawio` | **Fig 1.1** | 4 layers + stakeholders + external services + concerns note |
| `Figure_2.1_Conceptual_Map_of_Literature.drawio` | **Fig 2.1** | two axes (theory→applied, global→local) converging on Suraksha; 5 gaps |
| `Figure_2.2_Workflow_Data_Flow_Across_System_Layers.drawio` | **Fig 2.2** | end-to-end data flow: report → mobile → API → ML → DB → dashboard → officer → alert → citizens |

### Use cases
| File | Figure | Notes |
|---|---|---|
| `Figure_4.1_UseCase_Main_System_Overview.drawio` | **Fig 4.1** | system-wide overview (new) |
| `use-cases/Figure_4.3 … 4.5`, `use-cases/Appendix_B.1 … B.5` | **Fig 4.3–4.5 + App B.1–B.5** | the 8 module diagrams delivered earlier — unchanged |

### Chapter 3–4 (structure)
| File | Figure | Layout cleanup needed |
|---|---|---|
| `Figure_4.12_Class_Diagram_Incident_Alert_Water.drawio` | **Fig 4.12** (Draft_Thesis_3) | **Low** — strict 4-band layout (middleware → control → service → entity → shared PrismaClient); edges routed only in the column gaps, nothing crosses a box. Trimmed to the classes the §4.10 paragraph names. |
| `Figure_4.8_Class_Diagram_Incident_Alert_Water.drawio` | Interim Fig 4.8 | same clean diagram, Interim number |
| `Figure_4.2_Core_ER_Diagram.drawio` | **Fig 4.2** (Draft_Thesis_3 numbering) | **Medium** — 19 entities on a 6-column grid, crow's-foot; nudge a few boxes so relationship lines don't cross. Verify against `schema.prisma` (`grep -c "^model " backend/prisma/schema.prisma` → 72). |
| `Figure_4.14_ER_Diagram_Core.drawio` | **Fig 4.14** (Interim numbering) | same diagram, Interim number |
| `Figure_4.1_System_Architecture_Diagram.drawio` | **Fig 4.1** (Draft_Thesis_3 numbering) | Low — presentation-ready; matches the §4.5 paragraph incl. graceful-degradation note |
| `Figure_4.13_System_Architecture_Four_Layer.drawio` | **Fig 4.13** (Interim-2 numbering) | same diagram, Interim number |

### Activity diagrams (vertical swimlanes)
| File | Figure | Cleanup |
|---|---|---|
| `Figure_4.6_Activity_Offline_First_Incident_Report_and_Sync.drawio` | **Fig 4.6** (Draft_Thesis_3, AD-1) | **Low** — hand-laid-out |
| `Figure_4.7_Activity_Severity_Triage_Human_in_the_Loop.drawio` | **Fig 4.7** (Draft_Thesis_3, AD-2) | **Low** — hand-laid-out; 4 lanes Backend / ML Service / DMC Officer / PostgreSQL |
| `Figure_4.9_Activity_Incident_Lifecycle.drawio` | **Fig 4.9** | **Medium** — check fork/join bar alignment; a few edges cross lanes (expected for cross-actor flow) |
| `Figure_4.6_Activity_Offline_First_Incident_Report_and_Sync.drawio` | **Fig 4.6** (Draft_Thesis_3) | **Low** — hand-laid-out swimlanes, non-crossing; the only tweak is nudging the `loop` frame if you resize nodes |
| `Activity_AD-1_Offline_Report_and_Sync.drawio` | auto-laid alt of Fig 4.6 | superseded by Fig 4.6 |
| `Figure_4.8_Activity_River_Forecast_to_Threshold_Alert_Dispatch.drawio` | **Fig 4.8** (Draft_Thesis_3, AD-3) | **Low** — hand-laid-out; 6 lanes; nudge the `loop` frame only if you resize nodes. (Distinct from the Interim `Figure_4.8_Class_Diagram_…`.) |
| `Activity_AD-3_River_Forecast_to_Alert.drawio` | auto-laid alt of Fig 4.8 | superseded |

### Sequence diagrams (lifelines + `alt`/`par`/`loop` frames)
| File | Figure | Cleanup |
|---|---|---|
| `Figure_4.9_Sequence_Offline_First_Incident_Report.drawio` | **Fig 4.9** (Draft_Thesis_3, SD-1) | **Medium** — full SD-1 (8 lifelines, nested `alt`/`par`/`loop`); check the frame rectangles wrap their messages, nudge if a node moved. Mirrors activity Fig 4.6. |
| `Figure_4.10_Sequence_Severity_Triage_Human_in_the_Loop.drawio` | **Fig 4.10** (Draft_Thesis_3, SD-2) | **Medium** — 4 lifelines, 3 nested `alt` frames (reachable/unreachable · auto/review · agree/correct); check the frame boxes wrap their messages. Mirrors activity Fig 4.7. |
| `Figure_4.10_Sequence_Incident_Submission_and_ML.drawio` | Interim Fig 4.10 (SD-1 + ML) | **Medium** — drag the `par` frame to enclose its messages |
| `Figure_4.11_Sequence_Officer_Validation_and_Task_Assignment.drawio` | **Fig 4.11** | Medium — position the `alt` frame |
| `Figure_4.12_Sequence_Offline_Sync_Mechanism.drawio` | **Fig 4.12** | Medium — position the `loop` frame |
| `Sequence_SD-3_River_Forecast_Alert_Dispatch.drawio` | extra (thesis SD-3) | **Medium-High** — 3 nested frames (`loop` / `alt` / `par`); resize them to wrap their messages |

### Chapter 4–5 (algorithms / flowcharts)
| File | Figure | Cleanup |
|---|---|---|
| `Figure_5.1_NLP_Pipeline_Flowchart.drawio` | **Fig 5.1** | Low |
| `Figure_5.2_ML_Classification_and_Uncertainty_Flowchart.drawio` | **Fig 5.2** | Low-Medium — the off-spine branch nodes (`un`, `auto`, `corr`) sit to the right; drag onto a tidy second column |
| `Figure_5.3_Framework_Workflow_Block_Diagram.drawio` | **Fig 5.3** | Low |
| `Flowchart_ALG-1_Prediction_Cache.drawio` | Appendix E | Low-Medium |
| `Flowchart_ALG-2_LSTM_Water_Forecast.drawio` | Appendix E | Low-Medium |
| `Flowchart_ALG-4_Duplicate_Detection.drawio` | Appendix E | Low-Medium |
| `Flowchart_ALG-5_Geo_Targeted_Alert_Relevance.drawio` | Appendix E | Low-Medium |
| `Flowchart_ALG-6_Offline_Sync_Queue_Drain.drawio` | Appendix E | Low-Medium |

For flowcharts the "cleanup" is only: the yes/no branch targets are placed in a
right-hand column with fixed `x/y`; after opening, select them and align, and drag
the "return to END" edges so they don't overlap the spine.

## Notation legend
| Element | Style |
|---|---|
| Actor | stick figure (`shape=umlActor`) |
| Use case | blue ellipse; `«include»` green dashed, `«extend»` orange dashed; generalisation hollow triangle |
| Process / action | blue rectangle · Decision | orange diamond · Start/End | green rounded · I/O | purple parallelogram |
| Fork / join | solid black bar |
| Class | 3-compartment box, `«service»` / `«control»` / `«entity»` / `«enumeration»` stereotype; dependency dashed-open, association plain |
| Entity (ER) | grey box, `PK` / `FK` marked; crow's-foot ends (`ERone` / `ERmany`) |
| Sequence | blue lifeline header + dashed line; solid arrow = call, dashed = return; `umlFrame` = combined fragment |
| Layer band / system boundary | grey rectangle, bold title top-left |

## Regenerating
`gen-all-diagrams.cjs` (in this folder) is the source. Edit the relevant block and:
```
node gen-all-diagrams.cjs      # rewrites every file in this folder
```
Use-case module diagrams (Fig 4.3–4.5, App B.1–B.5) are regenerated by
`use-cases/gen-usecase-drawio.cjs` instead.

## Consistency checklist (lecturer guideline 30)
- ER ↔ `schema.prisma` (names, PK/FK, cardinality)
- Fig 4.9 activity ↔ Fig 4.10/4.11 sequence (same steps/decisions)
- Fig 5.2 flowchart ↔ ALG-3 pseudocode ↔ `uncertainty_triage.py` ↔ explanation
- Fig 4.13 architecture ↔ `05-architecture.md`
- ML component claims ↔ `suraksha-ml/models/*_info.json`
