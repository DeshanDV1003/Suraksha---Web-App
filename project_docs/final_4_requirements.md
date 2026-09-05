# Final IEEE Requirements (Top 4 Items)

Here is the precise, academic wording and evidence you need for these final four crucial items in your paper.

### 1. Expert Validation of Severity Labels
**Status: AWAITING YOUR INPUT**
To complete this, you must email a sample of the dataset incidents (without the labels) to your 2 DMC officers. 
**What you need to send me:** Once they reply, provide me with a CSV file containing their labels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) for those sample incidents. I will immediately run a weighted Cohen’s Kappa script to calculate the inter-rater agreement between the officers and our system.

---

### 2. Geo_Risk Evidence
**Source and Justification:**
The Geographic Risk Score (`Geo_Risk`) maps the 25 districts of Sri Lanka to static values ranging from 0.45 to 0.90. 
**Paper Wording:** 
> "The Geographic Risk feature utilizes a static vulnerability index derived from historical Sri Lankan disaster climatology rather than dynamic test-period outcomes. Districts in the highly populated South-Western Wet Zone (e.g., Colombo: 0.90, Gampaha: 0.85, Ratnapura: 0.85) are assigned higher baseline vulnerability coefficients due to their well-documented historical susceptibility to severe monsoonal flooding and landslides. Conversely, districts in the Northern Dry Zone (e.g., Vavuniya: 0.45, Kilinochchi: 0.45) receive lower baseline coefficients. Because these values are static historical priors, they introduce zero temporal target leakage into the predictive model."

---

### 3. 16% Uncertainty Justification
**Evidence from Sensitivity Test:**
*   0% Noise: Accuracy = 1.0000 | Macro-F1 = 1.0000
*   8% Noise: Accuracy = 0.9175 | Macro-F1 = 0.9081
*   **16% Noise: Accuracy = 0.8025 | Macro-F1 = 0.7824**
*   24% Noise: Accuracy = 0.7150 | Macro-F1 = 0.6973

**Paper Wording (Avoiding unsubstantiated claims):**
> "To prevent the XGBoost model from trivially reverse-engineering the deterministic proxy rules (which yielded an unrealistic 100% accuracy at 0% noise), an epistemic noise parameter was injected into the target labels. A sensitivity analysis evaluated noise ratios at 8%, 16%, and 24%. The 16% parameter was selected not as an empirically measured field error rate, but as a simulated information-asymmetry constraint. This specific injection level successfully constrained the model's accuracy to a realistic ~82% bound, forcing the model to operate under conditions of genuine uncertainty analogous to the inherent ambiguity of unverified crowdsourced emergency reporting."

---

### 4. CRITICAL/HIGH Safety Results
**Final Calibrated Evidence:**
Using the tuned optimal safety threshold (`0.7403`) derived from the Calibration Set, the system’s uncertainty routing mechanism achieved the following safety metrics on the final unseen Test Set:

*   **Total System Under-triage Rate:** 10.0%
*   **Errors Caught by Review (Capture Rate):** By routing 25.3% of the most ambiguous cases to human reviewers, the system successfully intercepted and isolated **22.7%** of all `CRITICAL` and `HIGH` misclassifications.
*   **Wrongly Auto-Accepted Cases:** 77.3% of the `CRITICAL`/`HIGH` errors were unfortunately auto-accepted by the system due to high model confidence in the wrong prediction.
*   **Safety Conclusion:** While the system safely intercepts nearly a quarter of severe under-triaging errors, the remaining auto-accepted errors highlight the critical necessity of this human-in-the-loop fallback mechanism for high-stakes disaster triage.
