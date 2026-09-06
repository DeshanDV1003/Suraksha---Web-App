# 02 — Literature Review / Related Work (Chapter 2 source)

Organise Chapter 2 into: (2.1) crisis-informatics platforms, (2.2) disaster text
classification & multilingual NLP, (2.3) flood / hydrological forecasting,
(2.4) uncertainty & human-in-the-loop ML, (2.5) offline-first mobile data
capture, (2.6) synthesis and gap. Cite each claim with Zotero; the entries below
are *topics to cite*, not fabricated citations.

## 2.1 Crisis-informatics and crowdsourced disaster platforms

- **Ushahidi / Crowdmap** — pioneered map-based crowdsourced crisis reporting
  (Kenya 2008, Haiti 2010). Strengths: open, SMS + web intake, deployable fast.
  Limitations relevant here: no ML triage, no offline-first mobile queue, no
  hydrological forecasting, English/UI-language dependent, moderation is manual.
- **AIDR (Artificial Intelligence for Disaster Response, QCRI)** — human-in-the-loop
  classification of disaster tweets; crowd labels train a classifier online.
  Relevant: validates the human-in-the-loop pattern this project uses for severity
  routing. Limitations: Twitter-only source, English-dominant, no command
  dashboard, no mobile capture.
- **PetaBencana / PetaJakarta** — flood crowdsourcing via social messaging in
  Indonesia; confirmed reports feed a public map. Relevant: real-world proof that
  citizen reports + a map are operationally useful. Limitations: single hazard,
  single channel, no offline queue, no severity model.
- **Sahana Eden** — open-source disaster-management platform (organisation,
  shelter, inventory, missing persons). Relevant: closest in *breadth* to
  Suraksha's dashboard. Limitations: no ML layer, no trilingual NLP intake, no
  offline-first mobile client, heavyweight to deploy.
- **National DMC tooling (Sri Lanka)** — situation reports and river/rainfall
  bulletins are produced as PDFs; there is no unified digital intake +
  triage + dashboard product in public use. This is the concrete local gap.

## 2.2 Disaster text classification & multilingual NLP

- **CrisisNLP / CrisisBench datasets and models** — benchmark corpora for
  informativeness and humanitarian-category classification of disaster tweets;
  transformer fine-tuning (BERT family) is the current standard. Almost entirely
  English (some Arabic/Spanish). Suraksha's intake targets **Sinhala + Tamil +
  English**, which are low-resource for NLP.
- **Language identification** — fastText `lid.176`, Unicode-script heuristics, and
  cascade approaches for short, code-mixed text. Suraksha uses a script →
  word-list → library cascade because citizen reports are short and code-mixed.
- **Named-entity recognition for disaster text** — extracting location, hazard
  type, casualty/affected counts, and dates from unstructured reports. Prior work
  uses gazetteer + statistical NER. Suraksha trains a lightweight neural NER on
  auto-annotated real DMC situation-report PDFs (labels: LOC, INCIDENT, COUNT,
  DATE, DAMAGE). **Be explicit that this is a silver-standard evaluation** —
  see `15-ml-evaluation.md`.
- **Neural machine translation for Si/Ta ⇄ En** — MarianMT / Google-Translate-class
  models. Suraksha translates non-English reports to English so a single
  downstream classifier/NER can operate.

## 2.3 Flood and hydrological forecasting

- **Physically-based hydrological models** (HEC-HMS, SWAT, MIKE) — accurate but
  data-hungry (catchment parameters, calibration), not real-time-friendly for a
  national dashboard.
- **Data-driven river-stage forecasting** — ANN / LSTM / GRU models predicting
  gauge height from lagged stage + rainfall. LSTMs dominate recent literature for
  1–24 h horizons. Key methodological points from the literature that this
  project follows: (a) chronological (not random) train/test split; (b) compare
  against a **naïve persistence baseline** (predict "same as now"); (c) report
  MAE in physical units (metres).
- **Google Flood Forecasting / river-forecasting-at-scale** — demonstrates
  operational LSTM forecasting but on curated global gauge feeds. Suraksha works
  from DMC bulletin PDFs (irregular ~3–8 h cadence), which is a harder,
  lower-quality input — state this as a limitation and a realism argument.

## 2.4 Uncertainty quantification & human-in-the-loop triage

- **Calibration** — temperature scaling (Guo et al.) to make softmax
  probabilities trustworthy before thresholding.
- **Selective prediction / abstention** — route low-confidence predictions to a
  human; characterise with a **risk–coverage curve** (accuracy of accepted
  predictions vs fraction automated). Suraksha reports this curve directly.
- **Conformal prediction** — distribution-free prediction sets with coverage
  guarantees; used here as an alternative routing signal.
- **Cost-sensitive / safety-first triage** — in disaster triage, *under-triage*
  (calling a CRITICAL event LOW) is far more dangerous than over-triage.
  Suraksha reports under-triage and over-triage rates separately.

## 2.5 Offline-first mobile data capture

- **CouchDB/PouchDB, Realm, WatermelonDB** — local-first datastores with sync.
- **Offline queue + eventual sync pattern** — store outbound mutations in a
  durable local table, drain FIFO on reconnection, mark each item
  synced/failed/retryable. Suraksha implements exactly this with **Expo SQLite**
  (`sync_queue` table) + a FIFO `syncService` + a connectivity monitor + an
  Expo background-fetch task.
- **Idempotency for retried mutations** — the literature recommends a
  client-generated idempotency key so a retried request the server already
  accepted is de-duplicated. Suraksha currently sends an `X-Original-Timestamp`
  header but the backend does not yet de-duplicate on it — this is a documented
  limitation and a future-work item (see `17-testing-and-evaluation.md`,
  test case TC-M-030).

## 2.6 Synthesis — where Suraksha sits

| Capability | Ushahidi | AIDR | PetaBencana | Sahana Eden | CrisisNLP work | **Suraksha** |
|---|---|---|---|---|---|---|
| Citizen map reporting | ✓ | – | ✓ | partial | – | ✓ |
| Trilingual (Si/Ta/En) intake | – | – | – | – | – | ✓ |
| ML severity triage | – | ✓ (tweets) | – | – | ✓ (research) | ✓ (146,544 real DMC records) |
| Uncertainty / human-in-the-loop routing | – | ✓ | – | – | partial | ✓ (calibrated, risk–coverage) |
| River-level forecasting | – | – | – | – | – | ✓ (LSTM, 47 stations) |
| Offline-first mobile queue | – | – | – | – | – | ✓ (0% data loss measured) |
| DMC command dashboard | partial | – | – | ✓ | – | ✓ (RBAC, real-time maps) |
| Evaluated on real national data | – | – | ✓ | – | – | ✓ (real DMC datasets) |
| Open reference implementation | ✓ | ✓ | partial | ✓ | ✓ | ✓ |

**Conclusion of Chapter 2:** each prior system/technique addresses a slice; none
addresses the *integration* — trilingual intake + offline-first capture + ML
triage/forecasting + command dashboard — evaluated end-to-end on real Sri Lanka
DMC data. Suraksha fills that gap.
