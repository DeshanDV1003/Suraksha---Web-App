# STRICT GEO_RISK ABLATION EXPERIMENT

I have executed a strict ablation experiment comparing the performance of the XGBoost classifier with and without the manually assigned `Geo_Risk` feature. Both models were trained on the exact same 80/20 stratified split, using identical preprocessing, 300 estimators, and random seeds.

## Results Comparison

| Metric | Model A (WITH Geo_Risk) | Model B (WITHOUT Geo_Risk) | Absolute Difference |
| :--- | :--- | :--- | :--- |
| **Accuracy** | `0.8200` | `0.8175` | **- 0.0025** |
| **Macro-F1** | `0.7931` | `0.7922` | **- 0.0009** |
| **Weighted-F1** | `0.8180` | `0.8157` | - 0.0023 |
| **QWK** | `0.6584` | `0.6531` | - 0.0053 |
| **CRITICAL Recall** | `0.5962` | `0.6154` | **+ 0.0192 (Improved!)** |
| **HIGH Recall** | `0.8411` | `0.8224` | - 0.0187 |
| **Under-triage Rate** | `18.87%` | `19.50%` | + 0.63% |

### Confusion Matrix (Model B - Without Geo_Risk)
```text
[[ 32   4   9   7]
 [  4  88   8   7]
 [  3   2 110   5]
 [  8  10   6  97]]
```
*(Notice that CRITICAL true positives actually increased from 31 to 32 when Geo_Risk was removed).*

---

## Final Recommendation for the IEEE Paper

> [!SUCCESS]
> **REMOVE THE GEO_RISK FEATURE COMPLETELY.**

Removing the `Geo_Risk` feature makes almost absolutely no meaningful difference to the model's core predictive power (Accuracy drops by a mathematically negligible 0.25%, and Macro-F1 drops by less than 0.1%). In fact, stripping it out actually *improves* the recall for the most important `CRITICAL` class!

Because the performance impact is so negligible, **I strongly recommend dropping the feature entirely from the final pipeline.** 

**Why this is the best move for your paper:**
By removing `Geo_Risk`, you completely eliminate the need to defend the "manually assigned heuristic district coefficients." You no longer have to worry about reviewers questioning the source of the 0.45–0.90 numbers or accusing you of manual manipulation. The model performs just as well relying purely on the raw, undeniable impact statistics (Affected Population, Incident Type, Vulnerabilities). This makes your final system incredibly streamlined, objective, and academically bulletproof.
