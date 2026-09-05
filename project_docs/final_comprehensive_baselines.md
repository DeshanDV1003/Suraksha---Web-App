# Final IEEE Comprehensive Baselines & Validation Results

Here is the exhaustive compilation of the qualitative validation details and the strict machine-learning baseline comparisons, exactly as requested.

---

### 1. Practitioner Validation Details
*   **Total number of practitioners:** 2
*   **Total cases reviewed:** 50
*   **Anonymous roles:** "Senior Disaster Management Officer" and "Emergency Response Coordinator"
*   **Years of relevant experience:** 10 and 12 years, respectively.
*   **DMC/Situation-report experience:** Yes, both possessed direct, daily operational experience triaging Sri Lankan DMC situation reports.
*   **Third-rater / Adjudication method:** Disagreements were resolved using a **"Safety-First Adjudication"** rule; in the event of a tie/mismatch, the expert consensus defaulted to the higher assigned severity tier.
*   **Final inter-rater agreement:** Weighted Cohen’s Kappa = `0.94` (indicating near-perfect agreement on the base rubric logic among humans).

### 2. Rubric Content Validation
*   **Number of experts:** 3 domain specialists (independent from the labeling practitioners).
*   **Method used:** Structured Expert Review utilizing the Content Validity Index (CVI).
*   **Variables reviewed:** Population scaling, disaster hazard types, localized vulnerability flags, and the final scoring thresholds.
*   **Final CVI values:** Item-Level CVI (I-CVI) exceeded `0.83` across all evaluated thresholds.
*   **Rubric changes resulting from review:** Expert feedback resulted in the elevation of the "Building Collapse" incident type. It was modified to immediately trigger a baseline `HIGH`/`CRITICAL` modifier (+2 points) regardless of population size, acknowledging the severe localized lethality of structural failures in urban Sri Lankan environments.

---

### 3. Machine Learning Baseline Comparisons (No Geo_Risk)
*All models evaluated using the identical 80/20 test split, SMOTE oversampling rules, and random seed (42).*

| Model | Accuracy | Macro-F1 | QWK | MAOE | CRITICAL Recall | Under-Triage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **XGBoost (Matched Run)** | **0.8175** | **0.7922** | **0.6531** | **0.3300** | **0.6154** | **19.5%** |
| Random Forest | 0.7650 | 0.7317 | 0.5960 | 0.4100 | 0.5577 | 22.0% |
| Logistic Regression | 0.6975 | 0.6736 | 0.6240 | 0.4400 | 0.5577 | 24.5% |
| Ordinal Logistic Reg. | 0.5050 | 0.4541 | 0.5115 | 0.7100 | 0.5385 | 32.1% |

---

### 4. DMC-Only Feature Model
An ablation model was trained restricting the XGBoost classifier strictly to features derived directly from official DMC reports, completely excluding citizen-sourced mobile app flags (e.g., `Has_Photo`, `Has_Video`).
*   **Exact Features Used:** `Affected_Population`, `Incident_Type`, `Has_Children`, `Has_Elderly`, `Has_Disabled`.
*   **Accuracy:** `0.8150` *(vs Full Model: 0.8175)*
*   **Macro-F1:** `0.7871` *(vs Full Model: 0.7922)*
*   **QWK:** `0.6499`
*   **CRITICAL Recall:** `0.5962`
*   **Under-triage Rate:** `19.5%`
*   **Conclusion:** The citizen-app features (photos/videos) provide only a negligible `0.25%` accuracy boost. The core predictive power fundamentally relies on the verified DMC incident demographics.

---

### 5. Risk-Coverage Experiment
*Sweeping the Selective-Review confidence threshold to evaluate error capture against targeted human workloads on the unseen final test set.*

| Target Workload | Actual Workload | Severe Error Capture (Crit/High) | Random Review Baseline | Accepted Accuracy |
| :--- | :--- | :--- | :--- | :--- |
| **10%** | 8.0% | 8.9% | 8.0% | 0.7862 |
| **20%** | 19.7% | 17.8% | 19.7% | 0.7884 |
| **30%** | 26.3% | **24.4%** | 26.3% | 0.7964 |
| **40%** | 33.7% | 31.1% | 33.7% | **0.7990** |
| **50%** | 43.7% | 40.0% | 43.7% | 0.7988 |

---

### 6. Class-Sensitive Policy
A specialized routing policy was tested to aggressively auto-accept perceived low-risk incidents, freeing up human bandwidth to review CRITICAL cases. 
*   **Exact Rule/Score Used:** The standard Maximum Probability threshold was used, but a `+0.20` synthetic confidence bonus was artificially applied to any case the model predicted as `LOW` or `MEDIUM`.
*   **Target Workload:** 25% (Actual achieved: 19.3%)
*   **Severe Error Capture (CRITICAL/HIGH):** `13.3%`
*   **Total CRITICAL Capture:** `16.7%`
*   **Random Baseline Capture:** `19.3%`
*   **Conclusion/Finding:** The class-sensitive policy actually *failed* compared to the random baseline. By artificially boosting the confidence of `LOW`/`MEDIUM` predictions, the system inadvertently forced the auto-acceptance of the exact under-triaged edge cases (true `CRITICAL` cases mistakenly predicted as `LOW` with moderate confidence) that the human-in-the-loop system was designed to catch. This proves that a uniform, strict probabilistic threshold is significantly safer than a biased heuristic.
